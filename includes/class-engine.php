<?php
/**
 * Game rules, ported line by line from assets/engine.js.
 * tests/engine-test.php checks both against tests/vectors.json.
 *
 * State is an associative array; times are Unix milliseconds.
 * Catalog: array( sid => array( 'name', 'slug', 'cat', 'care' ) ), sorted by sid.
 */

defined( 'ABSPATH' ) || exit;

class Reef_Keeper_Engine {

	const HOUR = 3600000;
	const DAY  = 86400000;

	const CARE      = array( 'easy', 'moderate', 'difficult', 'expert-only' );
	const PRICE     = array( 20, 45, 90, 160 );
	const FRAGILITY = array( 1, 1.15, 1.3, 1.5 );

	const TANKS = array(
		array( 'id' => 'nano', 'liters' => 20, 'cap' => 3, 'maxCare' => 0, 'cats' => array( 'fish' ), 'xp' => 0, 'cost' => 0 ),
		array( 'id' => 'small', 'liters' => 60, 'cap' => 6, 'maxCare' => 1, 'cats' => array( 'fish' ), 'xp' => 150, 'cost' => 100 ),
		array( 'id' => 'medium', 'liters' => 150, 'cap' => 10, 'maxCare' => 1, 'cats' => array( 'fish', 'coral', 'invert' ), 'xp' => 400, 'cost' => 250 ),
		array( 'id' => 'reef', 'liters' => 300, 'cap' => 15, 'maxCare' => 2, 'cats' => array( 'fish', 'coral', 'invert' ), 'xp' => 900, 'cost' => 500 ),
		array( 'id' => 'expert', 'liters' => 500, 'cap' => 22, 'maxCare' => 3, 'cats' => array( 'fish', 'coral', 'invert' ), 'xp' => 1800, 'cost' => 900 ),
	);

	const TASKS = array(
		'feed'   => array( 'cd' => 6, 'coins' => 4, 'xp' => 10 ),
		'test'   => array( 'cd' => 12, 'coins' => 3, 'xp' => 8 ),
		'glass'  => array( 'cd' => 8, 'coins' => 4, 'xp' => 10 ),
		'change' => array( 'cd' => 20, 'coins' => 8, 'xp' => 15 ),
	);

	const HUNGER_RATE  = 100 / 48;
	const QUALITY_RATE = 100 / 96;
	const ALGAE_RATE   = 100 / 72;
	const DAMAGE       = 0.9;
	const REGEN        = 3;
	const SICK         = 75;
	const MAX_SIM      = 60 * self::DAY;
	const READ_COINS   = 50;
	const READ_XP      = 20;
	const START_COINS  = 40;

	public static function now() {
		return (int) round( microtime( true ) * 1000 );
	}

	public static function care_rank( $care ) {
		$i = array_search( $care, self::CARE, true );
		return false === $i ? 0 : $i;
	}

	private static function info( $catalog, $sid ) {
		if ( isset( $catalog[ $sid ] ) ) {
			$s = $catalog[ $sid ];
			return array(
				'rank' => self::care_rank( $s['care'] ),
				'cat'  => empty( $s['cat'] ) ? 'fish' : $s['cat'],
			);
		}
		return array( 'rank' => 0, 'cat' => 'fish' );
	}

	/** Math.round() as in JS; PHP's round() pre-rounds and can differ at .5 edges. */
	private static function js_round( $n ) {
		return floor( $n + 0.5 );
	}

	private static function round2( $n ) {
		return self::js_round( $n * 100 ) / 100;
	}

	public static function pick_starter( $catalog ) {
		$easy_fish = array();
		foreach ( $catalog as $sid => $s ) {
			if ( 'fish' === $s['cat'] && 0 === self::care_rank( $s['care'] ) ) {
				$easy_fish[] = (string) $sid;
			}
		}
		foreach ( $easy_fish as $sid ) {
			$s     = $catalog[ $sid ];
			$label = ! empty( $s['slug'] ) ? $s['slug'] : ( isset( $s['name'] ) ? $s['name'] : '' );
			if ( preg_match( '/clown/i', $label ) ) {
				return $sid;
			}
		}
		if ( $easy_fish ) {
			return $easy_fish[0];
		}
		foreach ( $catalog as $sid => $s ) {
			return (string) $sid;
		}
		return null;
	}

	public static function new_state( $catalog, $now ) {
		$state   = array(
			'v'          => 1,
			't'          => $now,
			'tank'       => 0,
			'coins'      => self::START_COINS,
			'xp'         => 0,
			'seq'        => 0,
			'fish'       => array(),
			'hunger'     => 0,
			'quality'    => 100,
			'algae'      => 0,
			'pending'    => 0,
			'cd'         => array(),
			'discovered' => array(),
			'read'       => array(),
			'memorial'   => array(),
			'events'     => array(),
			'lastDeath'  => 0,
		);
		$starter = self::pick_starter( $catalog );
		if ( $starter ) {
			self::add_animal( $state, $starter );
			$state['discovered'][] = $starter;
		}
		return $state;
	}

	private static function add_animal( &$state, $sid ) {
		$state['seq']   += 1;
		$state['fish'][] = array( 'uid' => $state['seq'], 'sid' => (string) $sid, 'health' => 100 );
	}

	private static function push_event( &$state, $ev ) {
		$state['events'][] = $ev;
		if ( count( $state['events'] ) > 20 ) {
			$state['events'] = array_slice( $state['events'], -20 );
		}
	}

	private static function step( &$state, $dt, $t, $catalog ) {
		$tank     = self::TANKS[ $state['tank'] ];
		$alive    = count( $state['fish'] );
		$cleaners = 0;
		$eaters   = 0;
		foreach ( $state['fish'] as $f ) {
			$c = self::info( $catalog, $f['sid'] )['cat'];
			if ( 'invert' === $c ) {
				$cleaners++;
			}
			if ( 'fish' === $c ) {
				$eaters++;
			}
		}

		if ( $eaters > 0 ) {
			$state['hunger'] = min( 100, $state['hunger'] + self::HUNGER_RATE * $dt );
		}
		$load             = 0.6 + 0.4 * min( 1, $alive / $tank['cap'] );
		$state['quality'] = max( 0, $state['quality'] - self::QUALITY_RATE * $load * $dt );
		$algae_rate       = self::ALGAE_RATE * max( 0.4, 1 - 0.15 * $cleaners );
		$state['algae']   = min( 100, $state['algae'] + $algae_rate * $dt );

		$dying = array();
		foreach ( $state['fish'] as $k => &$f ) {
			$i      = self::info( $catalog, $f['sid'] );
			$stress = 0;
			if ( 'fish' === $i['cat'] && $state['hunger'] >= 100 ) {
				$stress += 1;
			}
			if ( $state['quality'] < 30 ) {
				$stress += 1;
			}
			if ( $state['algae'] >= 90 ) {
				$stress += 0.25;
			}
			if ( $stress > 0 ) {
				$f['health'] -= self::DAMAGE * self::FRAGILITY[ $i['rank'] ] * $stress * $dt;
			} else {
				$f['health'] = min( 100, $f['health'] + self::REGEN * $dt );
			}
			if ( $f['health'] <= 0 ) {
				$dying[] = $k;
			}
			$happy = $f['health'] >= 80 && ( 'fish' !== $i['cat'] || $state['hunger'] < 70 );
			if ( $happy ) {
				$state['pending'] += 0.25 * $dt;
			}
		}
		unset( $f );
		$state['pending'] = min( $state['pending'], 6 * max( 1, $alive ) );

		if ( $dying ) {
			if ( $state['lastDeath'] && $t - $state['lastDeath'] < self::DAY ) {
				foreach ( $dying as $k ) {
					$state['fish'][ $k ]['health'] = 1;
				}
			} else {
				$fish = $state['fish'];
				usort(
					$dying,
					function ( $a, $b ) use ( $fish, $catalog ) {
						$fa = $fish[ $a ];
						$fb = $fish[ $b ];
						$by = $fa['health'] <=> $fb['health'];
						if ( 0 === $by ) {
							$by = self::info( $catalog, $fb['sid'] )['rank'] <=> self::info( $catalog, $fa['sid'] )['rank'];
						}
						return 0 === $by ? $fa['uid'] <=> $fb['uid'] : $by;
					}
				);
				$dead = $state['fish'][ $dying[0] ];
				foreach ( array_slice( $dying, 1 ) as $k ) {
					$state['fish'][ $k ]['health'] = 1;
				}
				unset( $state['fish'][ $dying[0] ] );
				$state['fish']        = array_values( $state['fish'] );
				$state['memorial'][]  = array( 'sid' => $dead['sid'], 't' => $t );
				$state['lastDeath']   = $t;
				self::push_event( $state, array( 'type' => 'death', 'sid' => $dead['sid'], 't' => $t ) );
			}
		}
	}

	public static function advance( &$state, $now, $catalog ) {
		if ( $now - $state['t'] > self::MAX_SIM ) {
			$state['t'] = $now - self::MAX_SIM;
		}
		while ( $state['t'] < $now ) {
			$next = min( $now, $state['t'] + self::HOUR );
			self::step( $state, ( $next - $state['t'] ) / self::HOUR, $next, $catalog );
			$state['t'] = $next;
		}
		foreach ( array( 'hunger', 'quality', 'algae', 'pending' ) as $k ) {
			$state[ $k ] = self::round2( $state[ $k ] );
		}
		foreach ( $state['fish'] as &$f ) {
			$f['health'] = self::round2( $f['health'] );
		}
		unset( $f );
		return $state;
	}

	public static function readings( $state ) {
		$q = $state['quality'];
		return array(
			'ph'     => self::js_round( ( 8.3 - ( 100 - $q ) * 0.008 ) * 100 ) / 100,
			'no3'    => (int) self::js_round( 2 + ( 100 - $q ) * 0.6 ),
			'temp'   => 25.5,
			'status' => $q >= 60 ? 'ok' : ( $q >= 30 ? 'warn' : 'bad' ),
		);
	}

	public static function cooldown_left( $state, $task, $now ) {
		$last  = isset( $state['cd'][ $task ] ) ? $state['cd'][ $task ] : 0;
		$until = $last + self::TASKS[ $task ]['cd'] * self::HOUR;
		return max( 0, $until - $now );
	}

	private static function reward( &$state, $coins, $xp ) {
		$state['coins'] += $coins;
		$state['xp']    += $xp;
	}

	private static function restart( &$state, $catalog ) {
		if ( $state['fish'] || $state['coins'] >= self::PRICE[0] ) {
			return array( 'ok' => false, 'error' => 'unneeded' );
		}
		$starter = self::pick_starter( $catalog );
		if ( ! $starter ) {
			return array( 'ok' => false, 'error' => 'unknown' );
		}
		self::add_animal( $state, $starter );
		$state['hunger']  = 0;
		$state['quality'] = 100;
		$state['algae']   = 0;
		return array( 'ok' => true, 'sid' => $starter );
	}

	public static function act( &$state, $task, $now, $catalog ) {
		if ( 'restart' === $task ) {
			return self::restart( $state, $catalog );
		}
		if ( 'collect' === $task ) {
			$coins = (int) floor( $state['pending'] );
			if ( $coins < 1 ) {
				return array( 'ok' => false, 'error' => 'nothing' );
			}
			$state['pending'] = self::round2( $state['pending'] - $coins );
			$state['coins']  += $coins;
			return array( 'ok' => true, 'coins' => $coins, 'xp' => 0 );
		}
		if ( ! isset( self::TASKS[ $task ] ) ) {
			return array( 'ok' => false, 'error' => 'unknown' );
		}
		$def = self::TASKS[ $task ];
		if ( self::cooldown_left( $state, $task, $now ) > 0 ) {
			return array( 'ok' => false, 'error' => 'cooldown' );
		}

		$res = array( 'ok' => true, 'coins' => $def['coins'], 'xp' => $def['xp'] );
		if ( 'feed' === $task ) {
			if ( $state['hunger'] < 25 ) {
				$state['quality']    = max( 0, $state['quality'] - 8 );
				$state['cd']['feed'] = $now;
				return array( 'ok' => true, 'coins' => 0, 'xp' => 0, 'note' => 'overfed' );
			}
			$state['hunger'] = 0;
		} elseif ( 'test' === $task ) {
			$res['readings'] = self::readings( $state );
		} elseif ( 'glass' === $task ) {
			if ( $state['algae'] < 15 ) {
				return array( 'ok' => false, 'error' => 'clean' );
			}
			$state['algae'] = 0;
		} elseif ( 'change' === $task ) {
			$state['quality'] = min( 100, $state['quality'] + 50 );
		}
		$state['cd'][ $task ] = $now;
		self::reward( $state, $def['coins'], $def['xp'] );
		return $res;
	}

	public static function price( $species ) {
		return self::PRICE[ self::care_rank( $species['care'] ) ];
	}

	public static function can_buy( $state, $sid, $catalog ) {
		if ( ! isset( $catalog[ $sid ] ) ) {
			return 'unknown';
		}
		$s    = $catalog[ $sid ];
		$tank = self::TANKS[ $state['tank'] ];
		if ( ! in_array( $s['cat'], $tank['cats'], true ) ) {
			return 'tank';
		}
		if ( self::care_rank( $s['care'] ) > $tank['maxCare'] ) {
			return 'tank';
		}
		if ( count( $state['fish'] ) >= $tank['cap'] ) {
			return 'full';
		}
		if ( $state['coins'] < self::price( $s ) ) {
			return 'coins';
		}
		return '';
	}

	public static function buy( &$state, $sid, $catalog ) {
		$sid = (string) $sid;
		$why = self::can_buy( $state, $sid, $catalog );
		if ( $why ) {
			return array( 'ok' => false, 'error' => $why );
		}
		$state['coins'] -= self::price( $catalog[ $sid ] );
		self::add_animal( $state, $sid );
		$first = ! in_array( $sid, $state['discovered'], true );
		if ( $first ) {
			$state['discovered'][] = $sid;
		}
		return array( 'ok' => true, 'discovered' => $first, 'sid' => $sid );
	}

	public static function can_upgrade( $state, $member ) {
		if ( ! isset( self::TANKS[ $state['tank'] + 1 ] ) ) {
			return 'max';
		}
		$next = self::TANKS[ $state['tank'] + 1 ];
		if ( ! $member ) {
			return 'member';
		}
		if ( $state['xp'] < $next['xp'] ) {
			return 'xp';
		}
		if ( $state['coins'] < $next['cost'] ) {
			return 'coins';
		}
		return '';
	}

	public static function upgrade( &$state, $member ) {
		$why = self::can_upgrade( $state, $member );
		if ( $why ) {
			return array( 'ok' => false, 'error' => $why );
		}
		$state['tank']   += 1;
		$state['coins']  -= self::TANKS[ $state['tank'] ]['cost'];
		$state['quality'] = 100;
		$state['algae']   = 0;
		return array( 'ok' => true, 'tank' => $state['tank'] );
	}

	public static function claim_read( &$state, $sid ) {
		$sid = (string) $sid;
		if ( ! in_array( $sid, $state['discovered'], true ) ) {
			return array( 'ok' => false, 'error' => 'undiscovered' );
		}
		if ( in_array( $sid, $state['read'], true ) ) {
			return array( 'ok' => false, 'error' => 'claimed' );
		}
		$state['read'][] = $sid;
		self::reward( $state, self::READ_COINS, self::READ_XP );
		return array( 'ok' => true, 'coins' => self::READ_COINS, 'xp' => self::READ_XP );
	}

	public static function is_sick( $state ) {
		foreach ( $state['fish'] as $f ) {
			if ( $f['health'] < self::SICK ) {
				return true;
			}
		}
		return false;
	}
}
