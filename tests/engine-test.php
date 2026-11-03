<?php
/**
 * Checks the PHP engine against the JS engine's results.
 * Run: php tests/engine-test.php   (regenerate vectors with: node tests/make-vectors.js)
 */

define( 'ABSPATH', __DIR__ );
require __DIR__ . '/../includes/class-engine.php';

$catalog = json_decode( file_get_contents( __DIR__ . '/catalog.json' ), true );
ksort( $catalog, SORT_NUMERIC );
$scenarios = json_decode( file_get_contents( __DIR__ . '/scenarios.json' ), true );
$vectors   = json_decode( file_get_contents( __DIR__ . '/vectors.json' ), true );
$t0        = gmmktime( 0, 0, 0, 11, 1, 2026 ) * 1000;

function rk_run( $sc, $catalog, $t0 ) {
	$now     = $t0;
	$state   = Reef_Keeper_Engine::new_state( $catalog, $now );
	$results = array();
	foreach ( $sc['ops'] as $op ) {
		list( $name, $arg ) = $op;
		if ( 'adv' === $name ) {
			$now += (int) round( $arg * Reef_Keeper_Engine::HOUR );
			Reef_Keeper_Engine::advance( $state, $now, $catalog );
		} elseif ( 'act' === $name ) {
			$results[] = Reef_Keeper_Engine::act( $state, $arg, $now, $catalog );
		} elseif ( 'buy' === $name ) {
			$results[] = Reef_Keeper_Engine::buy( $state, $arg, $catalog );
		} elseif ( 'upgrade' === $name ) {
			$results[] = Reef_Keeper_Engine::upgrade( $state, $arg );
		} elseif ( 'read' === $name ) {
			$results[] = Reef_Keeper_Engine::claim_read( $state, $arg );
		} elseif ( 'set' === $name ) {
			$state = array_merge( $state, $arg );
		}
	}
	return array( 'name' => $sc['name'], 'results' => $results, 'state' => $state );
}

/* Compare like JSON would: numbers by value, empty arrays equal empty objects. */
function rk_diff( $a, $b, $path = '' ) {
	if ( is_array( $a ) && is_array( $b ) ) {
		$keys = array_unique( array_merge( array_keys( $a ), array_keys( $b ) ) );
		foreach ( $keys as $k ) {
			if ( ! array_key_exists( $k, $a ) || ! array_key_exists( $k, $b ) ) {
				return "$path/$k missing";
			}
			$d = rk_diff( $a[ $k ], $b[ $k ], "$path/$k" );
			if ( $d ) {
				return $d;
			}
		}
		return '';
	}
	if ( is_numeric( $a ) && is_numeric( $b ) && ! is_string( $a ) && ! is_string( $b ) ) {
		return abs( $a - $b ) < 1e-6 ? '' : "$path: php " . var_export( $a, true ) . ' js ' . var_export( $b, true );
	}
	return $a === $b ? '' : "$path: php " . var_export( $a, true ) . ' js ' . var_export( $b, true );
}

$fail = 0;
foreach ( $scenarios as $i => $sc ) {
	$got  = json_decode( json_encode( rk_run( $sc, $catalog, $t0 ) ), true );
	$diff = rk_diff( $got, $vectors[ $i ] );
	echo ( $diff ? 'FAIL ' : 'ok   ' ) . $sc['name'] . ( $diff ? "  $diff" : '' ) . "\n";
	$fail += $diff ? 1 : 0;
}
exit( $fail ? 1 : 0 );
