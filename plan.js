/* How each stop is grouped on the page: in town → grab → do (by area, in order) → turn in → hold.
   Shared by both guides.
   "@Name"     = a checkbox row from the stop's quest list (matched by the start of its name;
                 "@A|B" tries A, then B, for rows that differ between the guides)
   plain text  = a numbered line you can tick (grab / turn-in lines auto-tick from your sync)
   k (kind): town, grab, do, turn, hold, dng, skip */
const PLAN={
s1:[
 {k:'grab',h:'Grab in Lakeshire',i:['Solomon\'s Law (Magistrate Solomon, town hall)','Blackrock Menace (Marshal Marris)','Shadow Magic','Howling in the Hills (skip if you already did it)','@What Comes Around','@Missing in Action · Blackrock Bounty']},
 {k:'do',h:'Do, in this order',i:['@A Watchful Eye','@Archmage Theocritus','@A Watchful Eye →','@Looking Further','@Shadow Magic','@Blackrock Menace','@Solomon\'s Law','@Theocritus\' Retrieval','@Howling in the Hills']},
 {k:'turn',h:'Back in Lakeshire: turn in',i:['@Solomon\'s Law ·','Howling in the Hills']},
 {k:'hold',h:'Hold for later',i:['@Morganth']}],
s2:[
 {k:'turn',h:'On the way: Tower of Azora',i:['@Theocritus\' Retrieval']},
 {k:'town',h:'In Stormwind',i:['@Train Lv 22','@Turn in library books','@Sell herbs']},
 {k:'grab',h:'Grab in Stormwind (for the Stockade)',i:['@The Color of Blood','@Quell the Uprising','@The Stockade Riots']}],
s3:[
 {k:'town',h:'In Darkshire',i:['@Set hearth']},
 {k:'grab',h:'Grab in Darkshire',i:['The Night Watch (Commander Althea Ebonlocke)','Seasoned Wolf Kabobs','Dusky Crab Cakes','Raven Hill','Ghost Hair Thread','@Crime and Punishment','@The Legend of Stalvan']},
 {k:'do',h:'Do, in this order',i:['@The Night Watch','@Ghost Hair Thread','@Eight-Legged Menaces','@Raven Hill','@Jitters\' Growling Gut','@Wolves at Our Heels','@Supplies from Darkshire','@Seasoned Wolf Kabobs','@Dusky Crab Cakes']},
 {k:'turn',h:'Back in Darkshire: turn in',i:['The Night Watch','Seasoned Wolf Kabobs','Dusky Crab Cakes','Supplies from Darkshire','Zombie Juice']},
 {k:'skip',h:'Skip',i:['@Look to the Stars']}],
s4:[
 {k:'dng',h:'Inside the Stockade',i:['@What Comes Around','@Crime and Punishment','@Quell the Uprising','@The Color of Blood','@The Stockade Riots']},
 {k:'turn',h:'Turn in',i:['@Turn in everything','Quell the Uprising (Warden Thelwater, right outside)','The Color of Blood (Nikova Raskol, Old Town)','The Stockade Riots (Warden Thelwater)','What Comes Around (Guard Berton, Lakeshire)','Crime and Punishment (Councilman Millstipe, Darkshire)']}],
s5:[
 {k:'do',h:'On the way: Loch Modan',i:['@Rumi of Gnomeregan','@Report to Mountaineer Rockgar','@Runes of the Sorcerer-Kings']},
 {k:'town',h:'In Menethil Harbor',i:['@Set hearth']},
 {k:'grab',h:'Grab in Menethil',i:['Daily Delivery','Young Crocolisk Skins','Claws from the Deep','Digging Through the Ooze','Apprentice\'s Duties','In Search of the Excavation Team (by the bridge)','@Lost in the Thicket Things']},
 {k:'do',h:'Do, in this order',i:['@Daily Delivery','@Digging Through the Ooze','@In Search of the Excavation Team','@Goaz Scrolls','@The Greenwarden','@Horrors in the Highland']},
 {k:'turn',h:'Back in Menethil: turn in',i:['@Apprentice\'s Duties','Daily Delivery','Young Crocolisk Skins','Claws from the Deep','Digging Through the Ooze','@Highland Hides']},
 {k:'skip',h:'Skip',i:['@Fall of Dun Modr']}],
s6:[
 {k:'town',h:'In Lakeshire',i:['@Fly Menethil']},
 {k:'grab',h:'Grab in Lakeshire',i:['@Songblade Search','Missing in Action, Blackrock Bounty, An Unwelcome Guest + WANTED: Lieutenant Fangore (if you aren\'t holding them already)']},
 {k:'do',h:'Do, in this order',i:['@Blackrock Bounty','@Missing in Action','@WANTED: Lieutenant Fangore']},
 {k:'turn',h:'Back in Lakeshire: turn in',i:['Missing in Action','Blackrock Bounty','An Unwelcome Guest','WANTED: Lieutenant Fangore']},
 {k:'town',h:'Then go train',i:['@Train Lv 24']},
 {k:'skip',h:'Skip',i:['@Tharil\'zun']}],
s8:[
 {k:'dng',h:'Inside the Excavation Site',i:['@Songblade Search','@Lost in the Thicket Things','@Highland Hides','@Horrors in the Highland','@Lost Relic Carry']},
 {k:'turn',h:'Turn in',i:['@Turn in everything','Heartwoven (Caitlin Grassman, Menethil)','Highland Hides (James Halloran, Menethil)','Horrors in the Highland (Rethiel the Greenwarden)','Lost Relic Carry (Prospector Whelgar)','Songblade Search (Dorin Songblade, Lakeshire, next stop)']}],
s9:[
 {k:'town',h:'In Darkshire',i:['@Set hearth']},
 {k:'grab',h:'Grab in Darkshire',i:['The Night Watch, part 2 (Commander Althea Ebonlocke)','Worgen in the Woods','The Legend of Stalvan (if you\'re holding it)']},
 {k:'do',h:'Do, in this order',i:['@Sven\'s Camp','@Proving Your Worth','@Raven Hill skeletons','@Crimes Against Anatomy','@Ghoulish Effigy','@Worgen in the Woods','@The Night Watch (part 2)']},
 {k:'turn',h:'Back in Darkshire: turn in',i:['The Night Watch','Worgen in the Woods','Ogre Thieves','Zombie Juice']},
 {k:'town',h:'Stormwind trip',i:['@The Legend of Stalvan','@Train Lv 28','@Turn in library books']},
 {k:'do',h:'Redridge trip',i:['@Morganth','@Songblade Search']},
 {k:'hold',h:'Only with a group',i:['@Mor\'Ladim']}],
s10:[
 {k:'town',h:'In Menethil Harbor',i:['@Set hearth','@The Doomed Fleet']},
 {k:'grab',h:'Grab',i:['The Search Continues (after Reclaiming Goods)','The Cursed Crew','Ormer\'s Revenge, part 2 (Prospector Whelgar)']},
 {k:'do',h:'Do, in this order',i:['@Reclaiming Goods','@The Cursed Crew','@Ormer\'s Revenge','@Uncovering the Past']},
 {k:'turn',h:'Back in Menethil: turn in',i:['Return the Statuette','Lifting the Curse']},
 {k:'hold',h:'Only with a group',i:['@The Dark Iron War']},
 {k:'skip',h:'Skip',i:['@Fall of Dun Modr']}],
s11:[
 {k:'do',h:'On the way: Darkshore',i:['@Boat to Auberdine|Teleport to Darnassus',"@Nar'thalas Almanac"]},
 {k:'town',h:'In Astranaar',i:['@Set hearth']},
 {k:'grab',h:'Grab in Astranaar',i:['Kayneth Stillwind (Shindrell Swiftfire)']},
 {k:'grab',h:"Grab at Maestra's Post (west)",i:['Vile Satyr! Dryads in Danger! (Illiyana)']},
 {k:'do',h:'Do, in this order',i:['@Vile Satyr','@Kayneth Stillwind','@Satyr Slaying','@Gleaming Crescent']},
 {k:'do',h:'Optional (mostly grey at 32)',i:['@Fallen Sky Lake',"@Raene's Cleansing",'@Ruuzel']},
 {k:'grab',h:'Grab the 4 BFD quests first (one at a time)',i:['@Knowledge in the Deeps','@Researching the Corruption','@In Search of Thaelrid','@Twilight Falls']},
 {k:'dng',h:'Dungeon',i:['@Blackfathom Deeps: run it']},
 {k:'skip',h:'Stay away',i:['@Horde camps']},
 {k:'dng',h:'Legacy dungeon · once, for points',i:['@Legacy: ']}],
s12:[
 {k:'do',h:"On the way: north Barrens",i:['@Arcanic Systems Manual','@Cozy Sleeping Bag · step 2']},
 {k:'do',h:"South Barrens, next to the Great Lift",i:['@A Host of Evil']},
 {k:'do',h:"Thousand Needles: Mirage Raceway (78, 77)",i:['@Hardened Shells','@Salt Flat Venom','@Load Lightening','@Rocket Car Parts','@A Bump in the Road','@Encrusted Tail Fins','@Hemet Nesingwary','@Martek the Exiled','@Wharfmaster Dizzywig','@Goblin Sponsorship, part 1','@Geomancy: The Stone-Cold Truth','@Packaged Pristine Pelts']},
 {k:'town',h:"Ratchet, then the boat",i:['@Ride to Ratchet','@Baxtan: On Destructive Magics','@Goblin Sponsorship, part 2','@Boat to Booty Bay']},
 {k:'town',h:"Arrive in Booty Bay",i:['@Goblin Sponsorship, part 3','@Expert Fishing book']}],
s13:[
 {k:'grab',h:"Booty Bay: grab these",i:['@Supply and Demand','@Bloodscalp Ears','@Hostile Takeover','@Singing Blue Shards','@Goblin Sponsorship, part 4','@The Haunted Isle','@The Stone of the Tides','@Supplies to Private Thorsen']},
 {k:'do',h:"Nesingwary's camp (35, 10)",i:['@Welcome to the Jungle','@Tiger Mastery, part 1','@Panther Mastery, part 1','@Raptor Mastery, part 1','@Tiger Mastery, part 2','@Panther Mastery, part 2','@Tiger Mastery, part 3','@Raptor Mastery, part 2']},
 {k:'do',h:"Rebel Camp (38, 3)",i:['@The Second Rebellion','@Bad Medicine','@Jungle Secrets','@Bookie Herod','@The Hidden Key','@The Spy Revealed!','@Patrol Schedules','@Report to Doren',"@Krazek's Cookery"]},
 {k:'do',h:"Middle STV",i:['@Basilisks: Should Petrification be Feared?']},
 {k:'turn',h:"Back in Booty Bay",i:['@Some Assembly Required','@Favor for Krazek','@Water Elementals','@Magical Analysis','@Excelsior']},
 {k:'dng',h:"Dungeon",i:['@The Drowned City']},
 {k:'do',h:"Heading north to leave STV",i:['@Return to Corporal Kaleb','@Tiger Mastery, part 4','@Panther Mastery, part 3','@Special Forces',"@Kurzen's Mystery"]}],
s14:[
 {k:'town',h:"Stormwind errands",i:['@The Missing Diplomat, part 1','@The Missing Diplomat, part 2','@The Missing Diplomat, part 3','@The Missing Diplomat, part 4','@Southshore',"@Malin's Request, part 1",'@Brother Anton','@Turn in library books']},
 {k:'do',h:"Quick Duskwood detour (fly to Darkshire)",i:['@The Missing Diplomat, part 5','@The Missing Diplomat, part 6']},
 {k:'town',h:"Back in Stormwind, then the tram to Ironforge",i:['@The Missing Diplomat, part 7','@The Missing Diplomat, part 8','@The Missing Diplomat, part 9','@The Missing Diplomat, part 10',"@Reclaimers' Business in Desolace"]},
 {k:'town',h:"Menethil Harbor",i:['@The Missing Diplomat, part 11','@The Missing Diplomat, part 12','@The Missing Diplomat, part 13']},
 {k:'do',h:"Thandol Span → Arathi",i:["@MacKreel's Moonshine","@Sully Balloo's Letter"]},
 {k:'do',h:"Refuge Pointe, Arathi (46, 47)",i:['@Northfold Manor','@Worth Its Weight in Gold','@Stromgarde Badges']},
 {k:'town',h:"Southshore, Hillsbrad (51, 58)",i:['@Set hearth + flight path','@Down the Coast',"@Farren's Proof, part 1","@Farren's Proof, part 2","@Farren's Proof, part 3",'@Stormwind Ho!','@Reassignment','@Syndicate Assassins',"@Bartolo's Yeti Fur Cloak",'@Costly Menace','@Hints of a New Plague?, part 1','@Crushridge Bounty','@Preserving Knowledge','@Return to Milton']},
 {k:'do',h:"Alterac Mountains",i:['@Foreboding Plans','@Encrypted Letter','@Noble Deaths','@Crushridge Warmongers','@Letter to Stormpike','@Strahnbrad Mystery','@Defensive Magics 101 (optional)']},
 {k:'dng',h:"Dungeon",i:['@City of Dalaran quests']},
 {k:'do',h:"Back to Arathi: Go'Shek Farm + Myzrael",i:['@Hints of a New Plague?, part 2','@Hints of a New Plague?, part 3','@Hints of a New Plague?, part 4','@Hints of a New Plague?, part 5','@The Princess Trapped','@Stones of Binding']},
 {k:'do',h:"Stromgarde (Refuge Pointe chain)",i:['@Wand over Fist',"@Trelane's Defenses","@An Apprentice's Enchantment",'@Attack on the Tower',"@Malin's Request, part 2",'@Wanted!  Marez Cowl','@Wanted!  Otto and Falconcrest']},
 {k:'do',h:"Faldir's Cove (south-west coast, 32, 81)",i:['@Land Ho!','@Drowned Sorrows','@Sunken Treasure, part 1','@Sunken Treasure, part 2','@Sunken Treasure, part 3','@Deep Sea Salvage']}],
s15:[
 {k:'do',h:"Theramore (boat from Menethil)",i:['@Boat Menethil → Theramore','@The Missing Diplomat, part 14','@The Missing Diplomat, part 15','@The Missing Diplomat, part 16','@The Missing Diplomat, part 17']},
 {k:'do',h:"Stonetalon on the way",i:['@Cozy Sleeping Bag · step 3','@Cozy Sleeping Bag · step 4','@Stonetalon Peak flight path','@Fury of the Land']},
 {k:'town',h:"Nijel's Point (66, 10)",i:['@Set hearth + flight path','@Centaur Bounty','@Reagents for Reclaimers Inc., part 1','@Reagents for Reclaimers Inc., part 2',"@Vahlarriel's Search, part 1","@Vahlarriel's Search, part 2","@Vahlarriel's Search, part 3",'@Search for Tyranis','@Return to Vahlarriel','@The Karnitol Shipwreck, part 1','@The Karnitol Shipwreck, part 2','@The Karnitol Shipwreck, part 3','@The Karnitol Shipwreck, part 4','@Down the Scarlet Path','@Reagents for Reclaimers Inc., part 3']},
 {k:'do',h:"West Desolace",i:['@Sceptre of Light','@Book of the Ancients',"@Claim Rackmore's Treasure!"]},
 {k:'do',h:"Kodo Graveyard + south",i:['@Kodo Roundup','@Bodyguard for Hire','@Gizelton Caravan','@Bone Collector','@Ghost-o-plasm Round Up','@Get Me Out of Here!','@Demons and You']},
 {k:'do',h:"New zone",i:["@Shen'dralas"]},
 {k:'turn',h:"Last trip to Nijel's Point",i:['@Reagents for Reclaimers Inc., part 4']},
 {k:'dng',h:"Later",i:['@Maraudon (later)']}],
s16:[
 {k:'town',h:'In Ironforge',i:['@Train Lv 40','@Dual spec','@Archmage Antonidas']},
 {k:'turn',h:'Ironforge hand-ins you carried here',i:['@Letter to Stormpike',"@Sully Balloo's Letter",'@The Karnitol Shipwreck, part 4','@Reagents for Reclaimers Inc., part 4']},
 {k:'town',h:'Get your mount',i:['@Riding + your first','@Bind your mount','@Re-import naowh']},
 {k:'do',h:'First ride: sleeping bag run',i:['@Cozy Sleeping Bag · step 5','@Cozy Sleeping Bag · step 6','@A Web of Lies','@Cozy Sleeping Bag · step 7']},
 {k:'dng',h:'Legacy dungeon · once, for points',i:['@Legacy: ']}],
s17:[
 {k:'town',h:'In Theramore',i:['@Set hearth']},
 {k:'grab',h:'Grab in Theramore',i:['The Black Shield','Lieutenant Paval Reethe']},
 {k:'do',h:'Do, in this order',i:['@Theramore quests','@Jarl Needs a Blade','@Hungry!','@RwlRwlRwlRwl!','@Stinky\'s Escape']},
 {k:'skip',h:'Not for now',i:['@No quest needed']},
 {k:'town',h:'Next time you\'re in a city',i:['@Train Lv 42']}],
s18:[
 {k:'do',h:'The Riverglades',i:['@Get there','@Do every quest you see']},
 {k:'dng',h:'Dungeon',i:['@Krol\'Dok']},
 {k:'dng',h:'Legacy dungeon · once, for points',i:['@Legacy: ']}],
s19:[
 {k:'grab',h:'Grab in the Badlands camps',i:['A Dwarf and His Tools','Barbecued Buzzard Wings','Pearl Diving']},
 {k:'do',h:'Do, in this order',i:['@A Dwarf and His Tools','@Barbecued Buzzard Wings','@Scrounging','@Pearl Diving','@Mummies']},
 {k:'dng',h:'Dungeon',i:['@Uldaman quests']}],
s20:[
 {k:'town',h:'In Booty Bay',i:['@Set hearth']},
 {k:'grab',h:'Grab in Booty Bay',i:['The Bloodsail Buccaneers','Akiris by the Bundle','Keep An Eye Out','Stranglethorn Fever']},
 {k:'do',h:'Do, in this order',i:['@Nesingwary Mastery','@The Bloodsail Buccaneers','@Akiris by the Bundle','@Partial Mystical Notes','@Mai\'Zoth','@The Curse of the Tides','@Green Hills']},
 {k:'dng',h:'Next',i:['@Zul\'Farrak']},
 {k:'dng',h:'Legacy dungeon · once, for points',i:['@Legacy: ']}],
s21:[
 {k:'town',h:'In Gadgetzan',i:['@Set hearth']},
 {k:'grab',h:'Grab in Gadgetzan',i:['Wastewander Justice','Water Pouch Bounty','Southsea Shakedown','Gahz\'ridian','Tooga\'s Quest','The Dunemaul Compound','Divino-matic Rod (for Zul\'Farrak)']},
 {k:'do',h:'Tanaris, in this order',i:['@Wastewander Justice','@Legends of the Tidesages','@Gahz\'ridian']},
 {k:'dng',h:'Dungeon',i:['@Zul\'Farrak']},
 {k:'do',h:'Feralas',i:['@Feathermoon','@Rescue OOX-22']},
 {k:'dng',h:'Later',i:['@Dire Maul']}],
s22:[
 {k:'town',h:'In Aerie Peak',i:['@Gryphon Master Talonaxe']},
 {k:'do',h:'Do, in this order',i:['@Troll Necklace Bounty','@The Altar of Zul','@Venomous Journeys','@Rescue OOX-09']},
 {k:'hold',h:'Only with a group',i:['@Saving Sharpbeak']},
 {k:'dng',h:'Dungeon',i:['@Alcaz Island']}],
s23:[
 {k:'do',h:'Searing Gorge',i:['@Searing Gorge quests','@A Mind of Metal']},
 {k:'do',h:'Blasted Lands',i:['@Blasted Lands buff','@Conjurer\'s Codex']},
 {k:'dng',h:'Dungeons',i:['@Sunken Temple','@Sanguine Sorcery','@Blackrock Depths']},
 {k:'dng',h:'Legacy dungeon · once, for points',i:['@Legacy: ']}],
s24:[
 {k:'do',h:'Felwood',i:['@Timbermaw Ally','@Northern Kalimdor','@Cleansing Felwood','@Corrupted plants']},
 {k:'do',h:'Azshara',i:['@Azshara quests','@Everyday Etiquette']},
 {k:'dng',h:'Dungeon',i:['@Blackmaw Hold']}],
s25:[
 {k:'grab',h:'Grab in Morgan\'s Vigil',i:['Extinguish the Firegut','Gor\'tesh the Brute Lord','Lower Blackrock Spire quests']},
 {k:'do',h:'Do, in this order',i:['@Extinguish the Firegut','@Gor\'tesh','@Libram quests']},
 {k:'dng',h:'Blackrock Mountain',i:['@Magma or Lava','@Lower Blackrock Spire']},
 {k:'dng',h:'Legacy dungeon · once, for points',i:['@Legacy: ']}],
s26:[
 {k:'grab',h:'Before you go: Stormwind or Ironforge',i:['A Call to Arms: The Plaguelands! (Crier Goodman)']},
 {k:'grab',h:'Grab in Chillwind Camp',i:['Clear the Way','Argent Dawn Commission']},
 {k:'do',h:'Do, in this order',i:['@The Scourge Cauldrons','@Undead Potatoes','@Locked Away','@A Matter of Time','@Glyphed Oaken Branch','@Argent Dawn Commission']},
 {k:'dng',h:'Dungeon',i:['@Scholomance','@Necromancy 101']}],
s27:[
 {k:'grab',h:'Grab in Marshal\'s Refuge',i:['Crystal Pylons','Bloodpetal Sprouts','Beware of Pterrordax']},
 {k:'do',h:'Do, in this order',i:['@Marshal\'s Refuge quests','@Linken chain','@Collect power crystals']},
 {k:'dng',h:'Dungeon',i:['@Shaper\'s Terrace']},
 {k:'dng',h:'Legacy dungeon · once, for points',i:['@Legacy: ']}],
s28:[
 {k:'grab',h:'Grab in Everlook',i:['Winterfall Firewater','Trouble in Winterspring!','Are We There, Yeti?']},
 {k:'do',h:'Do, in this order',i:['@Winterfall Firewater','@Ka-Boom!','@The Ruins of Kel\'Theril','@Strange Sources']},
 {k:'hold',h:'Only with a group',i:['@High Chief Winterfall']}],
s29:[
 {k:'town',h:'At Light\'s Hope Chapel',i:['@A Study of the Light']},
 {k:'do',h:'Do, in this order',i:['@Darrowshire chain','@Demon Dogs','@Hameya\'s Plea','@The Knight and the Lady','@Scourge: Undead Menace']},
 {k:'dng',h:'Dungeon',i:['@Stratholme']},
 {k:'town',h:'Ding!',i:['@DING 60']}]
};
