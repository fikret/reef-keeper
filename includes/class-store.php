<?php
/**
 * Members' tanks, in user meta. The simulation is lazy: every read advances
 * the state from its last timestamp, so nothing runs while nobody looks
 * (the hourly reminder job is the only background reader).
 */

defined( 'ABSPATH' ) || exit;

class Reef_Keeper_Store {

	const META      = 'reef_keeper_state';
	const LAST_CARE = 'reef_keeper_last_care';
	const LANG      = 'reef_keeper_lang';
	const MAIL      = 'reef_keeper_mail';
	const OPT_OUT   = 'reef_keeper_no_email';
	const MIGRATED  = 'reef_keeper_migrated';

	const CARE_TASKS = array( 'feed', 'glass', 'change' );

	public static function raw( $user_id ) {
		$s = get_user_meta( $user_id, self::META, true );
		return is_array( $s ) && isset( $s['v'] ) ? $s : null;
	}

	/** Load, advance to now and save. Returns the state. */
	public static function load( $user_id, $catalog, $now ) {
		$state = self::raw( $user_id );
		if ( ! $state ) {
			$state = Reef_Keeper_Engine::new_state( $catalog, $now );
			update_user_meta( $user_id, self::LAST_CARE, (int) floor( $now / 1000 ) );
		}
		Reef_Keeper_Engine::advance( $state, $now, $catalog );
		self::save( $user_id, $state );
		return $state;
	}

	public static function save( $user_id, $state ) {
		update_user_meta( $user_id, self::META, $state );
	}

	public static function touch_care( $user_id, $now ) {
		update_user_meta( $user_id, self::LAST_CARE, (int) floor( $now / 1000 ) );
		// Re-arm the "sick" reminder; keep the death marker so an old death isn't mailed twice.
		$mail = get_user_meta( $user_id, self::MAIL, true );
		if ( is_array( $mail ) && ! empty( $mail['sick'] ) ) {
			$mail['sick'] = 0;
			update_user_meta( $user_id, self::MAIL, $mail );
		}
	}

	/** The JSON shape the browser expects (empty maps stay objects). */
	public static function export( $state ) {
		$state['cd'] = (object) $state['cd'];
		return $state;
	}

	/**
	 * Turn a guest's localStorage tank into a member tank. Guests can edit
	 * their storage, so only nano-tank-sized values survive.
	 */
	public static function from_guest( $guest, $catalog, $now ) {
		$state = Reef_Keeper_Engine::new_state( $catalog, $now );
		if ( ! is_array( $guest ) || 1 !== ( isset( $guest['v'] ) ? (int) $guest['v'] : 0 ) ) {
			return $state;
		}
		$num   = function ( $key, $min, $max ) use ( $guest ) {
			$v = isset( $guest[ $key ] ) && is_numeric( $guest[ $key ] ) ? (float) $guest[ $key ] : $min;
			return max( $min, min( $max, $v ) );
		};
		$valid = function ( $sid ) use ( $catalog ) {
			return is_scalar( $sid ) && isset( $catalog[ (string) $sid ] );
		};

		$nano             = Reef_Keeper_Engine::TANKS[0];
		$state['coins']   = (int) $num( 'coins', 0, 300 );
		$state['xp']      = (int) $num( 'xp', 0, Reef_Keeper_Engine::TANKS[1]['xp'] - 1 );
		$state['hunger']  = $num( 'hunger', 0, 100 );
		$state['quality'] = $num( 'quality', 0, 100 );
		$state['algae']   = $num( 'algae', 0, 100 );
		$state['pending'] = $num( 'pending', 0, 6 * $nano['cap'] );
		$state['t']       = (int) $num( 't', $now - Reef_Keeper_Engine::MAX_SIM, $now );
		$state['lastDeath'] = (int) $num( 'lastDeath', 0, $now );

		$fish = array();
		foreach ( isset( $guest['fish'] ) && is_array( $guest['fish'] ) ? $guest['fish'] : array() as $f ) {
			if ( count( $fish ) >= $nano['cap'] || ! is_array( $f ) || ! isset( $f['sid'] ) || ! $valid( $f['sid'] ) ) {
				continue;
			}
			$sp = $catalog[ (string) $f['sid'] ];
			if ( ! in_array( $sp['cat'], $nano['cats'], true ) || Reef_Keeper_Engine::care_rank( $sp['care'] ) > $nano['maxCare'] ) {
				continue;
			}
			$health = isset( $f['health'] ) && is_numeric( $f['health'] ) ? (float) $f['health'] : 100;
			$fish[] = array( 'uid' => count( $fish ) + 1, 'sid' => (string) $f['sid'], 'health' => max( 1, min( 100, $health ) ) );
		}
		if ( $fish ) {
			$state['fish'] = $fish;
			$state['seq']  = count( $fish );
		}

		$list = function ( $key ) use ( $guest, $valid ) {
			$out = array();
			foreach ( isset( $guest[ $key ] ) && is_array( $guest[ $key ] ) ? $guest[ $key ] : array() as $sid ) {
				if ( $valid( $sid ) ) {
					$out[] = (string) $sid;
				}
			}
			return array_values( array_unique( $out ) );
		};
		$state['read'] = array_values( array_intersect( $list( 'read' ), $list( 'discovered' ) ) );

		foreach ( isset( $guest['cd'] ) && is_array( $guest['cd'] ) ? $guest['cd'] : array() as $task => $at ) {
			if ( isset( Reef_Keeper_Engine::TASKS[ $task ] ) && is_numeric( $at ) ) {
				$state['cd'][ $task ] = (int) min( $now, $at );
			}
		}
		foreach ( isset( $guest['memorial'] ) && is_array( $guest['memorial'] ) ? array_slice( $guest['memorial'], -50 ) : array() as $m ) {
			if ( is_array( $m ) && isset( $m['sid'], $m['t'] ) && $valid( $m['sid'] ) ) {
				$state['memorial'][] = array( 'sid' => (string) $m['sid'], 't' => (int) min( $now, $m['t'] ) );
			}
		}

		// Only animals that really lived in the tank count as discovered; otherwise
		// an edited localStorage could claim every reading reward.
		$seen = array();
		foreach ( array_merge( $state['fish'], $state['memorial'] ) as $a ) {
			$seen[] = $a['sid'];
		}
		$state['discovered'] = array_values( array_unique( $seen ) );
		$state['read']       = array_values( array_intersect( $state['read'], $state['discovered'] ) );
		return $state;
	}
}
