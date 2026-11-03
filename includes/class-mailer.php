<?php
/**
 * Hourly reminder job. Looks only at members who haven't cared for their tank
 * in 60+ hours, advances their tank and emails when it turns sick (day ~3)
 * or when an animal has died (day ~5, with the 24 h emergency window).
 * At most one email per member per day; every email has an unsubscribe link.
 */

defined( 'ABSPATH' ) || exit;

class Reef_Keeper_Mailer {

	const HOOK  = 'reef_keeper_hourly';
	const BATCH  = 200;
	const CURSOR = 'reef_keeper_mail_offset';

	public static function init() {
		add_action( self::HOOK, array( __CLASS__, 'run' ) );
		add_action( 'template_redirect', array( __CLASS__, 'unsubscribe' ) );
	}

	public static function schedule() {
		if ( ! wp_next_scheduled( self::HOOK ) ) {
			wp_schedule_event( time() + 300, 'hourly', self::HOOK );
		}
	}

	public static function unschedule() {
		wp_clear_scheduled_hook( self::HOOK );
	}

	public static function run() {
		$opts = Reef_Keeper_Settings::get();
		if ( empty( $opts['emails'] ) ) {
			return;
		}
		$now     = Reef_Keeper_Engine::now();
		$catalog = Reef_Keeper_Species::catalog();
		$offset  = (int) get_option( self::CURSOR, 0 );
		$users   = get_users(
			array(
				'fields'     => 'ID',
				'number'     => self::BATCH,
				'offset'     => $offset,
				'orderby'    => 'ID',
				'meta_query' => array(
					'relation' => 'AND',
					array(
						'key'     => Reef_Keeper_Store::LAST_CARE,
						'value'   => (int) floor( $now / 1000 ) - 60 * HOUR_IN_SECONDS,
						'compare' => '<',
						'type'    => 'NUMERIC',
					),
					array(
						'key'     => Reef_Keeper_Store::OPT_OUT,
						'compare' => 'NOT EXISTS',
					),
				),
			)
		);
		// Walk through all candidates a batch per hour, then start over.
		update_option( self::CURSOR, count( $users ) < self::BATCH ? 0 : $offset + self::BATCH, false );
		foreach ( $users as $uid ) {
			self::check( (int) $uid, $catalog, $now, $opts );
		}
	}

	private static function check( $uid, $catalog, $now, $opts ) {
		$state = Reef_Keeper_Store::raw( $uid );
		if ( ! $state ) {
			return;
		}
		Reef_Keeper_Engine::advance( $state, $now, $catalog );
		Reef_Keeper_Store::save( $uid, $state );

		$mail = get_user_meta( $uid, Reef_Keeper_Store::MAIL, true );
		$mail = is_array( $mail ) ? $mail : array( 'sick' => 0, 'death' => 0, 'last' => 0 );
		if ( $now - $mail['last'] < Reef_Keeper_Engine::DAY ) {
			return;
		}

		$kind = '';
		if ( $state['lastDeath'] > $mail['death'] ) {
			$kind          = 'death';
			$mail['death'] = $state['lastDeath'];
		} elseif ( $state['fish'] && Reef_Keeper_Engine::is_sick( $state ) && ! $mail['sick'] ) {
			$kind         = 'sick';
			$mail['sick'] = $now;
		}
		if ( ! $kind ) {
			return;
		}

		$user = get_userdata( $uid );
		if ( ! $user || ! is_email( $user->user_email ) ) {
			return;
		}
		$lang = get_user_meta( $uid, Reef_Keeper_Store::LANG, true );
		$msg  = self::message( $kind, 'tr' === $lang ? 'tr' : 'en', $state, $catalog, $uid, $opts );
		if ( wp_mail( $user->user_email, $msg['subject'], $msg['body'], array( 'Content-Type: text/html; charset=UTF-8' ) ) ) {
			$mail['last'] = $now;
			update_user_meta( $uid, Reef_Keeper_Store::MAIL, $mail );
		}
	}

	private static function message( $kind, $lang, $state, $catalog, $uid, $opts ) {
		$who = '';
		if ( 'death' === $kind ) {
			$last = end( $state['memorial'] );
			$who  = $last ? self::name( $last['sid'], $lang, $catalog ) : '';
		} elseif ( $state['fish'] ) {
			$weak = $state['fish'];
			usort(
				$weak,
				function ( $a, $b ) {
					return $a['health'] <=> $b['health'];
				}
			);
			$who = self::name( $weak[0]['sid'], $lang, $catalog );
		}
		$left  = count( $state['fish'] );
		$texts = array(
			'en' => array(
				'sick_subject'  => 'Your %s is sick 🐠',
				'sick_body'     => 'The water in your Reef Keeper tank is getting dirty and %s is not feeling well. A quick feed and water change will bring it back.',
				'death_subject' => 'Sad news from your reef',
				'death_body'    => '%s didn\'t make it.',
				'death_left'    => 'You have 24 hours to save the %d animals still in your tank. Feed them and change the water.',
				'death_empty'   => 'Your tank is empty now, but you can start again any time.',
				'button'        => 'Open my tank',
				'footer'        => 'You get this because you play Reef Keeper on Reef Network.',
				'unsub'         => 'Stop these emails',
			),
			'tr' => array(
				'sick_subject'  => '%s hasta 🐠',
				'sick_body'     => 'Resif Bakıcısı tankındaki su kirleniyor ve %s kendini iyi hissetmiyor. Kısa bir besleme ve su değişimi onu iyileştirir.',
				'death_subject' => 'Resifinden üzücü bir haber',
				'death_body'    => '%s hayatını kaybetti.',
				'death_left'    => 'Tankında kalan %d hayvanı kurtarmak için 24 saatin var. Onları besle ve suyu değiştir.',
				'death_empty'   => 'Tankın artık boş ama istediğin zaman yeniden başlayabilirsin.',
				'button'        => 'Tankımı aç',
				'footer'        => 'Bu e-postayı Reef Network’te Resif Bakıcısı oynadığın için alıyorsun.',
				'unsub'         => 'Bu e-postaları durdur',
			),
		);
		$t     = $texts[ $lang ];
		$who   = $who ? $who : ( 'tr' === $lang ? 'Balığın' : 'fish' );
		$game  = $opts['game_url'];
		$unsub = add_query_arg(
			array(
				'reef_keeper_unsub' => $uid,
				'sig'               => self::sig( $uid ),
			),
			home_url( '/' )
		);

		if ( 'sick' === $kind ) {
			$subject = sprintf( $t['sick_subject'], $who );
			$lines   = array( sprintf( $t['sick_body'], $who ) );
		} else {
			$subject = $t['death_subject'];
			$lines   = array( sprintf( $t['death_body'], $who ), $left ? sprintf( $t['death_left'], $left ) : $t['death_empty'] );
		}

		$body  = '<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:520px;margin:0 auto;color:#0f2438;line-height:1.5">';
		$body .= '<h2 style="margin:0 0 12px">' . esc_html( $subject ) . '</h2>';
		foreach ( $lines as $line ) {
			$body .= '<p>' . esc_html( $line ) . '</p>';
		}
		$body .= '<p style="margin:22px 0"><a href="' . esc_url( $game ) . '" style="background:#0a6fb3;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">' . esc_html( $t['button'] ) . '</a></p>';
		$body .= '<p style="color:#5b6f82;font-size:12px">' . esc_html( $t['footer'] ) . ' <a href="' . esc_url( $unsub ) . '" style="color:#5b6f82">' . esc_html( $t['unsub'] ) . '</a></p></div>';

		return array(
			'subject' => $subject,
			'body'    => $body,
		);
	}

	/** Species name in the member's language (cron runs in the default one). */
	private static function name( $sid, $lang, $catalog ) {
		$id = apply_filters( 'wpml_object_id', (int) $sid, 'product', true, $lang );
		if ( $id && get_post( $id ) ) {
			return html_entity_decode( get_the_title( $id ), ENT_QUOTES, 'UTF-8' );
		}
		return isset( $catalog[ $sid ] ) ? $catalog[ $sid ]['name'] : '';
	}

	private static function sig( $uid ) {
		return substr( wp_hash( 'reef-keeper-unsub-' . $uid ), 0, 20 );
	}

	public static function unsubscribe() {
		if ( empty( $_GET['reef_keeper_unsub'] ) || empty( $_GET['sig'] ) ) {
			return;
		}
		$uid = absint( $_GET['reef_keeper_unsub'] );
		$sig = sanitize_text_field( wp_unslash( $_GET['sig'] ) );
		if ( ! $uid || ! hash_equals( self::sig( $uid ), $sig ) ) {
			return;
		}
		update_user_meta( $uid, Reef_Keeper_Store::OPT_OUT, 1 );
		$tr = 'tr' === get_user_meta( $uid, Reef_Keeper_Store::LANG, true );
		wp_die(
			esc_html( $tr ? 'Reef Keeper e-postaları kapatıldı. Tankın seni beklemeye devam ediyor.' : 'Reef Keeper emails are off. Your tank will still be waiting for you.' ),
			'Reef Keeper',
			array( 'response' => 200 )
		);
	}
}
