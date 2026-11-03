<?php
/**
 * REST API for members: /wp-json/reef-keeper/v1/{state,action,buy,upgrade,discover,migrate}.
 * Every response is { result, view: { state, now, member } }.
 */

defined( 'ABSPATH' ) || exit;

class Reef_Keeper_Rest {

	const NS = 'reef-keeper/v1';

	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'routes' ) );
	}

	public static function routes() {
		$auth  = function () {
			return is_user_logged_in();
		};
		$route = function ( $path, $method, $cb, $args = array() ) use ( $auth ) {
			register_rest_route(
				self::NS,
				$path,
				array(
					'methods'             => $method,
					'callback'            => array( __CLASS__, $cb ),
					'permission_callback' => $auth,
					'args'                => $args,
				)
			);
		};
		$sid = array(
			'sid' => array(
				'required'          => true,
				'type'              => 'string',
				'validate_callback' => function ( $v ) {
					return is_scalar( $v ) && ctype_digit( (string) $v );
				},
			),
		);
		$route( 'state', 'GET', 'state' );
		$route(
			'action',
			'POST',
			'action',
			array(
				'task' => array(
					'required' => true,
					'type'     => 'string',
					'enum'     => array( 'feed', 'test', 'glass', 'change', 'collect', 'restart' ),
				),
			)
		);
		$route( 'buy', 'POST', 'buy', $sid );
		$route( 'upgrade', 'POST', 'upgrade' );
		$route( 'discover', 'POST', 'discover', $sid );
		$route( 'migrate', 'POST', 'migrate' );
	}

	/** Run $fn( &$state, $now, $catalog ) on the current user's tank, then respond. */
	private static function with_state( $fn ) {
		$uid     = get_current_user_id();
		$catalog = Reef_Keeper_Species::catalog();
		$now     = Reef_Keeper_Engine::now();
		$state   = Reef_Keeper_Store::load( $uid, $catalog, $now );
		$result  = $fn( $state, $now, $catalog );
		Reef_Keeper_Store::save( $uid, $state );
		return rest_ensure_response(
			array(
				'result' => $result,
				'view'   => array(
					'state'  => Reef_Keeper_Store::export( $state ),
					'now'    => $now,
					'member' => true,
				),
			)
		);
	}

	public static function state() {
		return self::with_state(
			function () {
				return null;
			}
		);
	}

	public static function action( WP_REST_Request $req ) {
		$task = $req['task'];
		$uid  = get_current_user_id();
		return self::with_state(
			function ( &$state, $now, $catalog ) use ( $task, $uid ) {
				$res = Reef_Keeper_Engine::act( $state, $task, $now, $catalog );
				if ( $res['ok'] && in_array( $task, Reef_Keeper_Store::CARE_TASKS, true ) ) {
					Reef_Keeper_Store::touch_care( $uid, $now );
				}
				return $res;
			}
		);
	}

	public static function buy( WP_REST_Request $req ) {
		$sid = (string) $req['sid'];
		return self::with_state(
			function ( &$state, $now, $catalog ) use ( $sid ) {
				return Reef_Keeper_Engine::buy( $state, $sid, $catalog );
			}
		);
	}

	public static function upgrade() {
		return self::with_state(
			function ( &$state ) {
				return Reef_Keeper_Engine::upgrade( $state, true );
			}
		);
	}

	public static function discover( WP_REST_Request $req ) {
		$sid = (string) $req['sid'];
		return self::with_state(
			function ( &$state ) use ( $sid ) {
				return Reef_Keeper_Engine::claim_read( $state, $sid );
			}
		);
	}

	/** Adopt a guest tank, but only into an account that hasn't really played yet. */
	public static function migrate( WP_REST_Request $req ) {
		$uid      = get_current_user_id();
		$existing = Reef_Keeper_Store::raw( $uid );
		$params   = $req->get_json_params();
		$fresh    = ! get_user_meta( $uid, Reef_Keeper_Store::MIGRATED, true )
			&& ( ! $existing || ( 0 === (int) $existing['tank'] && 0 === (int) $existing['xp'] ) );
		if ( $fresh && isset( $params['state'] ) ) {
			$now   = Reef_Keeper_Engine::now();
			$state = Reef_Keeper_Store::from_guest( $params['state'], Reef_Keeper_Species::catalog(), $now );
			Reef_Keeper_Store::save( $uid, $state );
			Reef_Keeper_Store::touch_care( $uid, $now );
			update_user_meta( $uid, Reef_Keeper_Store::MAIL, array( 'sick' => 0, 'death' => $state['lastDeath'], 'last' => 0 ) );
			update_user_meta( $uid, Reef_Keeper_Store::MIGRATED, 1 );
		}
		return self::with_state(
			function () use ( $fresh ) {
				return array( 'ok' => $fresh );
			}
		);
	}
}
