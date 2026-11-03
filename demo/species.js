/* Demo species, copied from reefnetwork.com's encyclopedia. The plugin builds this list from WooCommerce on the live site. */
(function (root) {
	var list = [
		{
			"sid": "17831",
			"name": "Yellowtail Blue Damselfish",
			"sci": "Chrysiptera parasema",
			"slug": "yellowtail-blue-damselfish-chrysiptera-parasema",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/yellowtail-blue-damselfish-chrysiptera-parasema/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/yellowtail-blue-damselfish-chrysiptera-parasema-1-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "split",
				"body": "#2f6fe0",
				"accent": "#ffd23f",
				"fin": "#ffd23f"
			}
		},
		{
			"sid": "17515",
			"name": "Lyretail Anthias",
			"sci": "Pseudanthias squamipinnis",
			"slug": "lyretail-anthias-pseudanthias-squamipinnis",
			"cat": "fish",
			"care": "difficult",
			"url": "https://reefnetwork.com/lyretail-anthias-pseudanthias-squamipinnis/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/lyretail-anthias-pseudanthias-squamipinnis-300x300.jpg",
			"look": {
				"shape": "slim",
				"pattern": "plain",
				"body": "#ff7a3d",
				"accent": "#ff3d7f",
				"fin": "#ffb04a"
			}
		},
		{
			"sid": "17410",
			"name": "Yellow Tang",
			"sci": "Zebrasoma flavescens",
			"slug": "yellow-tang-zebrasoma-flavescens",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/yellow-tang-zebrasoma-flavescens/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/yellow-tang-zebrasoma-flavescens-300x300.jpg",
			"look": {
				"shape": "tall",
				"pattern": "plain",
				"body": "#ffd21f",
				"accent": "#ffffff",
				"fin": "#ffc400"
			}
		},
		{
			"sid": "16458",
			"name": "Ocellaris Clownfish",
			"sci": "Amphiprion ocellaris",
			"slug": "ocellaris-clownfish-amphiprion-ocellaris",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/ocellaris-clownfish-amphiprion-ocellaris/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/ocellaris-clownfish-amphiprion-ocellaris-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "bands",
				"body": "#ff7b1c",
				"accent": "#ffffff",
				"fin": "#ff7b1c"
			}
		},
		{
			"sid": "16181",
			"name": "Green Chromis",
			"sci": "Chromis viridis",
			"slug": "green-chromis-chromis-viridis",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/green-chromis-chromis-viridis/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/10/green-chromis-chromis-viridis-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "plain",
				"body": "#7fe3c4",
				"accent": "#b5fff0",
				"fin": "#6fd3b6"
			}
		},
		{
			"sid": "15943",
			"name": "Neon Goby",
			"sci": "Elacatinus oceanops",
			"slug": "neon-goby-elacatinus-oceanops",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/neon-goby-elacatinus-oceanops/",
			"img": "https://reefnetwork.com/wp-content/uploads/neon-goby-elacatinus-oceanops-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "stripe",
				"body": "#2a2d3a",
				"accent": "#33b8ff",
				"fin": "#2a2d3a"
			}
		},
		{
			"sid": "15503",
			"name": "Mushroom Coral",
			"sci": "Discosoma sp.",
			"slug": "mushroom-coral-discosoma-sp",
			"cat": "coral",
			"care": "easy",
			"url": "https://reefnetwork.com/mushroom-coral-discosoma-sp/",
			"img": "https://reefnetwork.com/wp-content/uploads/mushroom-coral-discosoma-sp-300x300.jpg",
			"look": {
				"shape": "mushroom",
				"pattern": "plain",
				"body": "#c0399a",
				"accent": "#5ef2c8",
				"fin": "#7d2a8a"
			}
		},
		{
			"sid": "15341",
			"name": "Hammer Coral",
			"sci": "Fimbriaphyllia ancora",
			"slug": "hammer-coral-fimbriaphyllia-ancora",
			"cat": "coral",
			"care": "moderate",
			"url": "https://reefnetwork.com/hammer-coral-fimbriaphyllia-ancora/",
			"img": "https://reefnetwork.com/wp-content/uploads/hammer-coral-fimbriaphyllia-ancora-300x300.jpg",
			"look": {
				"shape": "hammer",
				"pattern": "plain",
				"body": "#61d6a0",
				"accent": "#e0ff8a",
				"fin": "#3b8a6a"
			}
		},
		{
			"sid": "14865",
			"name": "Neon Pineapple Tree Coral",
			"sci": "Capnella sp.",
			"slug": "neon-pineapple-tree-coral-capnella-sp",
			"cat": "coral",
			"care": "easy",
			"url": "https://reefnetwork.com/neon-pineapple-tree-coral-capnella-sp/",
			"img": "https://reefnetwork.com/wp-content/uploads/neon-pineapple-tree-coral-capnella-sp-300x300.jpg",
			"look": {
				"shape": "tree",
				"pattern": "plain",
				"body": "#f1e6c8",
				"accent": "#9fe870",
				"fin": "#d8c9a0"
			}
		},
		{
			"sid": "14103",
			"name": "Citron Goby",
			"sci": "Gobiodon citrinus",
			"slug": "citron-goby-gobiodon-citrinus",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/citron-goby-gobiodon-citrinus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/08/citron-goby-gobiodon-citrinus-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "stripe",
				"body": "#ffe23a",
				"accent": "#7ad0ff",
				"fin": "#ffe23a"
			}
		},
		{
			"sid": "13331",
			"name": "Yellow Line Goby",
			"sci": "Elacatinus figaro",
			"slug": "yellow-line-goby-elacatinus-figaro",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/yellow-line-goby-elacatinus-figaro/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/08/yellow-line-goby-elacatinus-figaro-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "stripe",
				"body": "#22252f",
				"accent": "#ffd800",
				"fin": "#22252f"
			}
		},
		{
			"sid": "11366",
			"name": "Electric Blue Hermit Crab",
			"sci": "Calcinus elegans",
			"slug": "electric-blue-hermit-crab-calcinus-elegans",
			"cat": "invert",
			"care": "easy",
			"url": "https://reefnetwork.com/electric-blue-hermit-crab-calcinus-elegans/",
			"img": "https://reefnetwork.com/wp-content/uploads/electric-blue-hermit-crab-calcinus-elegans-300x300.jpg",
			"look": {
				"shape": "crab",
				"pattern": "plain",
				"body": "#1d4fd8",
				"accent": "#ff8a1c",
				"fin": "#111a3a"
			}
		},
		{
			"sid": "9172",
			"name": "Red Head Goby",
			"sci": "Elacatinus puncticulatus",
			"slug": "red-head-goby-elacatinus-puncticulatus",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/red-head-goby-elacatinus-puncticulatus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/07/red-head-goby-elacatinus-puncticulatus-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "gradient",
				"body": "#f2e3b0",
				"accent": "#ff3b2f",
				"fin": "#e8d39a"
			}
		},
		{
			"sid": "9040",
			"name": "Tangaroa Goby",
			"sci": "Ctenogobiops tangaroai",
			"slug": "tangaroa-goby-ctenogobiops-tangaroai",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/tangaroa-goby-ctenogobiops-tangaroai/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/07/tangaroa-goby-ctenogobiops-tangaroai-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "spots",
				"body": "#f3efe6",
				"accent": "#e89a2c",
				"fin": "#e8e0d0"
			}
		},
		{
			"sid": "8651",
			"name": "Yellow Cardinalfish",
			"sci": "Ostorhinchus luteus",
			"slug": "yellow-cardinalfish-ostorhinchus-luteus",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/yellow-cardinalfish-ostorhinchus-luteus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/07/yellow-cardinalfish-ostorhinchus-luteus-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "plain",
				"body": "#ffe26a",
				"accent": "#ffcd2e",
				"fin": "#ffd84d"
			}
		},
		{
			"sid": "8130",
			"name": "Candy Basslet",
			"sci": "Liopropoma carmabi",
			"slug": "deepwater-candy-basslet-liopropoma-carmabi",
			"cat": "fish",
			"care": "expert-only",
			"url": "https://reefnetwork.com/deepwater-candy-basslet-liopropoma-carmabi/",
			"img": "https://reefnetwork.com/wp-content/uploads/deepwater-candy-basslet-liopropoma-carmabi-300x300.jpg",
			"look": {
				"shape": "slim",
				"pattern": "stripe",
				"body": "#ff6a3a",
				"accent": "#ffd23a",
				"fin": "#ff4d6b"
			}
		},
		{
			"sid": "7882",
			"name": "Sharknose Goby",
			"sci": "Elacatinus evelynae",
			"slug": "sharknose-goby-elacatinus-evelynae",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/sharknose-goby-elacatinus-evelynae/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/05/sharknose-goby-elacatinus-evelynae-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "stripe",
				"body": "#2b2e3a",
				"accent": "#ffe14a",
				"fin": "#2b2e3a"
			}
		},
		{
			"sid": "7775",
			"name": "Panamic Barnacle Blenny",
			"sci": "Acanthemblemaria hancocki",
			"slug": "panamic-barnacle-blenny",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/panamic-barnacle-blenny/",
			"img": "https://reefnetwork.com/wp-content/uploads/panamic-barnacle-blenny-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "gradient",
				"body": "#5a4a3a",
				"accent": "#ffcc33",
				"fin": "#4a3a2a"
			}
		},
		{
			"sid": "7679",
			"name": "Black Barred Convict Goby",
			"sci": "Priolepis nocturna",
			"slug": "black-barred-convict-goby-priolepis-nocturna",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/black-barred-convict-goby-priolepis-nocturna/",
			"img": "https://reefnetwork.com/wp-content/uploads/black-barred-convict-goby-black-barred-convict-goby-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "bands",
				"body": "#d99a5a",
				"accent": "#3a2a22",
				"fin": "#c48650"
			}
		},
		{
			"sid": "7499",
			"name": "Broadstripe Goby",
			"sci": "Elacatinus prochilos",
			"slug": "broadstripe-goby-elacatinus-prochilos",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/broadstripe-goby-elacatinus-prochilos/",
			"img": "https://reefnetwork.com/wp-content/uploads/broadstripe-goby-elacatinus-prochilos-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "stripe",
				"body": "#2b2e3a",
				"accent": "#4ac8ff",
				"fin": "#2b2e3a"
			}
		},
		{
			"sid": "7251",
			"name": "Allen’s Damselfish",
			"sci": "Pomacentrus alleni",
			"slug": "allens-damselfish-pomacentrus-alleni",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/allens-damselfish-pomacentrus-alleni/",
			"img": "https://reefnetwork.com/wp-content/uploads/allens-damselfish-pomacentrus-alleni-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "split",
				"body": "#2d7cf0",
				"accent": "#ffe066",
				"fin": "#ffe066"
			}
		},
		{
			"sid": "6944",
			"name": "Speckled Damsel",
			"sci": "Pomacentrus bankanensis",
			"slug": "speckled-damsel-pomacentrus-bankanensis",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/speckled-damsel-pomacentrus-bankanensis/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/04/speckled-damsel-pomacentrus-bankanensis-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "spots",
				"body": "#5a4a6a",
				"accent": "#ff9a3a",
				"fin": "#ffd84a"
			}
		},
		{
			"sid": "6729",
			"name": "Pink-Streaked Wrasse",
			"sci": "Pseudocheilinops ataenia",
			"slug": "pink-streaked-wrasse",
			"cat": "fish",
			"care": "difficult",
			"url": "https://reefnetwork.com/pink-streaked-wrasse/",
			"img": "https://reefnetwork.com/wp-content/uploads/pink-streaked-wrasse-300x300.jpg",
			"look": {
				"shape": "slim",
				"pattern": "stripe",
				"body": "#ff9ac8",
				"accent": "#ffd5e8",
				"fin": "#ff7ab0"
			}
		},
		{
			"sid": "6532",
			"name": "Tail Spot Blenny",
			"sci": "Ecsenius stigmatura",
			"slug": "tail-spot-blenny-ecsenius-stigmatura",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/tail-spot-blenny-ecsenius-stigmatura/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/03/tail-spot-blenny-ecsenius-stigmatura-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "gradient",
				"body": "#7a6a5a",
				"accent": "#ffd84a",
				"fin": "#6a5a4a"
			}
		},
		{
			"sid": "6308",
			"name": "Ring-Eyed Dottyback",
			"sci": "Pseudoplesiops typus",
			"slug": "ring-eyed-dottyback-pseudoplesiops-typus",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/ring-eyed-dottyback-pseudoplesiops-typus/",
			"img": "https://reefnetwork.com/wp-content/uploads/ring-eyed-dottyback-300x300.jpg",
			"look": {
				"shape": "slim",
				"pattern": "plain",
				"body": "#ff9a2a",
				"accent": "#ffd04a",
				"fin": "#ff8a1a"
			}
		},
		{
			"sid": "6157",
			"name": "Yellow Priolepis Goby",
			"sci": "Priolepis aureoviridis",
			"slug": "yellow-priolepis-goby",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/yellow-priolepis-goby/",
			"img": "https://reefnetwork.com/wp-content/uploads/yellow-priolepis-goby-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "bands",
				"body": "#ffcc3a",
				"accent": "#c47a2a",
				"fin": "#ffbb2a"
			}
		},
		{
			"sid": "6036",
			"name": "Starry Goby",
			"sci": "Asterropteryx semipunctatus",
			"slug": "starry-goby-asterropteryx-semipunctatus",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/starry-goby-asterropteryx-semipunctatus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/02/starry-goby-asterropteryx-semipunctatus-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "spots",
				"body": "#5a5a6a",
				"accent": "#6ae8ff",
				"fin": "#4a4a5a"
			}
		},
		{
			"sid": "5973",
			"name": "Link’s Goby",
			"sci": "Amblygobius linki",
			"slug": "links-goby-amblygobius-linki",
			"cat": "fish",
			"care": "moderate",
			"url": "https://reefnetwork.com/links-goby-amblygobius-linki/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/02/links-goby-amblygobius-linki-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "stripe",
				"body": "#e8d8b8",
				"accent": "#c46a3a",
				"fin": "#d8c8a8"
			}
		},
		{
			"sid": "5862",
			"name": "Mandarin Dragonet",
			"sci": "Synchiropus splendidus",
			"slug": "mandarin-dragonet-synchiropus-splendidus",
			"cat": "fish",
			"care": "difficult",
			"url": "https://reefnetwork.com/mandarin-dragonet-synchiropus-splendidus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/02/mandarin-dragonet-synchiropus-splendidus-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "psy",
				"body": "#ff7a1a",
				"accent": "#1a9aff",
				"fin": "#2ad08a"
			}
		},
		{
			"sid": "5728",
			"name": "Turban Snail",
			"sci": "Tectus fenestratus",
			"slug": "turban-snail-tectus-fenestratus",
			"cat": "invert",
			"care": "easy",
			"url": "https://reefnetwork.com/turban-snail-tectus-fenestratus/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/01/turban-snail-tectus-fenestratus-300x300.jpg",
			"look": {
				"shape": "snail",
				"pattern": "plain",
				"body": "#b8a07a",
				"accent": "#7a5a3a",
				"fin": "#d8c8a8"
			}
		},
		{
			"sid": "5568",
			"name": "Yasha Goby",
			"sci": "Stonogobiops yasha",
			"slug": "yasha-goby-stonogobiops-yasha",
			"cat": "fish",
			"care": "difficult",
			"url": "https://reefnetwork.com/yasha-goby-stonogobiops-yasha/",
			"img": "https://reefnetwork.com/wp-content/uploads/yasha-goby-stonogobiops-yasha-300x300.jpg",
			"look": {
				"shape": "long",
				"pattern": "stripe",
				"body": "#ffffff",
				"accent": "#ff5a3a",
				"fin": "#ffd84a"
			}
		},
		{
			"sid": "5192",
			"name": "Rose Anthias",
			"sci": "Odontanthias katayamai",
			"slug": "rose-anthias-odontanthias-katayamai",
			"cat": "fish",
			"care": "expert-only",
			"url": "https://reefnetwork.com/rose-anthias-odontanthias-katayamai/",
			"img": "https://reefnetwork.com/wp-content/uploads/2026/01/rose-anthias-odontanthias-katayamai-300x300.jpg",
			"look": {
				"shape": "slim",
				"pattern": "gradient",
				"body": "#ff5aa0",
				"accent": "#ffd23a",
				"fin": "#ff3a8a"
			}
		},
		{
			"sid": "4873",
			"name": "Azure Damselfish",
			"sci": "Chrysiptera hemicyanea",
			"slug": "azure-damselfish-chrysiptera-hemicyanea",
			"cat": "fish",
			"care": "easy",
			"url": "https://reefnetwork.com/azure-damselfish-chrysiptera-hemicyanea/",
			"img": "https://reefnetwork.com/wp-content/uploads/azure-damselfish-chrysiptera-hemicyanea-300x300.jpg",
			"look": {
				"shape": "round",
				"pattern": "split",
				"body": "#1f6ae8",
				"accent": "#ffd42a",
				"fin": "#ffd42a"
			}
		}
	];
	if (typeof module === 'object' && module.exports) module.exports = list;
	else root.RK_DEMO_SPECIES = list;
})(this);
