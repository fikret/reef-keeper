<?php
/**
 * Settings → Reef Keeper. One option array; every field has a working default
 * for reefnetwork.com.
 */

defined( 'ABSPATH' ) || exit;

class Reef_Keeper_Settings {

	const OPTION = 'reef_keeper_settings';

	public static function defaults() {
		return array(
			'category'  => 'saltwater-aquarium-encyclopedia',
			'care_meta' => 'livestock_care_level',
			'game_url'  => home_url( '/reef-keeper/' ),
			'join_url'  => home_url( '/?post_type=jet-form-builder&p=260' ),
			'login_url' => home_url( '/sign-in/' ),
			'emails'    => 1,
		);
	}

	public static function get() {
		$saved = get_option( self::OPTION, array() );
		return array_merge( self::defaults(), is_array( $saved ) ? array_filter( $saved, 'strlen' ) : array() );
	}

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ) );
		add_action( 'admin_init', array( __CLASS__, 'register' ) );
	}

	public static function menu() {
		add_options_page( 'Reef Keeper', 'Reef Keeper', 'manage_options', 'reef-keeper', array( __CLASS__, 'page' ) );
	}

	public static function register() {
		register_setting(
			'reef_keeper',
			self::OPTION,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize' ),
			)
		);
	}

	public static function sanitize( $in ) {
		$in = is_array( $in ) ? $in : array();
		return array(
			'category'  => sanitize_title( isset( $in['category'] ) ? $in['category'] : '' ),
			'care_meta' => sanitize_key( isset( $in['care_meta'] ) ? $in['care_meta'] : '' ),
			'game_url'  => esc_url_raw( isset( $in['game_url'] ) ? $in['game_url'] : '' ),
			'join_url'  => esc_url_raw( isset( $in['join_url'] ) ? $in['join_url'] : '' ),
			'login_url' => esc_url_raw( isset( $in['login_url'] ) ? $in['login_url'] : '' ),
			'emails'    => empty( $in['emails'] ) ? '0' : '1',
		);
	}

	public static function page() {
		$o      = self::get();
		$fields = array(
			'category'  => array( 'Encyclopedia product category (slug)', 'text' ),
			'care_meta' => array( 'Care level meta key', 'text' ),
			'game_url'  => array( 'Game page URL (the page with [reef_keeper])', 'url' ),
			'join_url'  => array( 'Join / register URL', 'url' ),
			'login_url' => array( 'Sign-in URL', 'url' ),
		);
		$count  = count( Reef_Keeper_Species::all() );
		?>
		<div class="wrap">
			<h1>Reef Keeper</h1>
			<p>Add the <code>[reef_keeper]</code> shortcode to a page. Species found: <strong><?php echo (int) $count; ?></strong>.</p>
			<form method="post" action="options.php">
				<?php settings_fields( 'reef_keeper' ); ?>
				<table class="form-table" role="presentation">
					<?php foreach ( $fields as $key => $f ) : ?>
						<tr>
							<th scope="row"><label for="rk-<?php echo esc_attr( $key ); ?>"><?php echo esc_html( $f[0] ); ?></label></th>
							<td><input class="regular-text" type="<?php echo esc_attr( $f[1] ); ?>" id="rk-<?php echo esc_attr( $key ); ?>" name="<?php echo esc_attr( self::OPTION . '[' . $key . ']' ); ?>" value="<?php echo esc_attr( $o[ $key ] ); ?>"></td>
						</tr>
					<?php endforeach; ?>
					<tr>
						<th scope="row">Reminder emails</th>
						<td><label><input type="checkbox" name="<?php echo esc_attr( self::OPTION ); ?>[emails]" value="1" <?php checked( '1', (string) $o['emails'] ); ?>> Email members when their fish get sick or die</label></td>
					</tr>
				</table>
				<?php submit_button(); ?>
			</form>
		</div>
		<?php
	}
}
