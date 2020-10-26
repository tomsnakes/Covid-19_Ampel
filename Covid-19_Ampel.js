// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: star-of-life;
// Script für https://scriptable.app
//
// Corona Ampel Widget. Zeigt neben der 7-Tage-Inzidenz weitere Infos zu einer Region. 
// Konfiguriert als kleines Widget. Schaltet automatisch auch in den DarkMode
//
// Quelle der Daten: https://npgeo-corona-npgeo-de.hub.arcgis.com
//
// Die Region wird gemäß JSON-Eintrag -> RKI NPGEO Corona -> Corona Landkreise -> Key = OBJECTID
// als Parameter des Widget verwendet. Hier findest du die Landkarte mit den Regionen:
// https://npgeo-corona-npgeo-de.hub.arcgis.com/datasets/917fc37a709542548cc3be077a786c17_0
// Mit einem Klick in die Karte öffnet sich eine Tabelle mit den zugehörigen Infos.
// Die benötigte OBJECTID ist der erste Eintrag der Tabelle. 
//
// Autor Script: Stefan Völkel, Okt. 2020 
// Änderung: 23.10.2020
// - Anstatt des "Klarnamens" der Region wird jetzt die OBJECTID als Parameter verwendet.
// - So kommt es zu einer eindeutigen Zuordnung z.B. bei Kreisfreien Städten und Landkreisen mit gleichen Namen.
// Änderung: 24.10.2020
// - Script aufgeräumt und Widget-Layout angepasst
// Änderung: 25.10.2020
// - Die Ampel ist jetzt vierfarbig. Da einige Regionen Regeln ab einer Inzidenz von 100 verschärfen, kommt jetzt noch Lila in's Spiel.
//
// Free to use and share!
// Ändere, ergänze, korrigiere und teile das Skript wie du magst!
// Download der aktuellen Version hier: https://fckaf.de/JHj


// Optionale Konfiguration
const debugMode = false    // Debug für Rahmen bei den einzelnen Stacks
const allwaysDark = false  // true für ständig dunkels Widget Design
// Stufen für die Grenzwerte - Ampel: Grün < 35 , Step1st Orange, Step2nd Rot, Step3rd Lila
const Step1st = 35
const Step2nd = 50
const Step3rd = 100

let ObjectID = 413                  // 413 = Berlin Mitte, Standardeinstellung für Widget. Wird verwendet, wenn kein eigenen Parameter gesetzt ist.
let param = args.widgetParameter	// Abfrage des Parameters vom Widget
if (param != null && param.length > 0) {
	ObjectID = param
}

// 
// Geräteinfos holen, getestet bei iPhone XS
// Keine Ahnung wie es auf anderen Geräten ausschaut ;-)
// 

let deviceScreen = Device.screenSize()
let padding = ((deviceScreen.width - 240) /5) // Default immer kleines Widget
let widgetSize = new Size(padding + 110, padding + 110)

if (isNaN(ObjectID)) {
	let widget = errorWidget("Die OBJEKTID muss eine Zahl sein.\r\rBitte überprüfe den Parameter im Widget.")
		Script.setWidget(widget)
		widget.presentSmall()
		Script.complete()
} else {
	
	// Daten als JSON bei https://npgeo-corona-npgeo-de.hub.arcgis.com abfragen
	let allItems = await loadItems(ObjectID)	

	if (allItems.features[0] == null) {
		logError(allItems)
		let widget = errorWidget("Es konnten keine Daten zur Region gefunden werden.\r\rBitte überprüfe den Parameter im Widget.")
			Script.setWidget(widget)
			widget.presentSmall()
			Script.complete()
	} else { 
		if (config.runsInWidget || true) {
			let widget = createWidget(allItems,widgetSize)
			Script.setWidget(widget)
			widget.presentSmall()
			Script.complete()
		}
		else {
			Script.complete()	
		}
	}	
}
 
function createWidget(allItems, widgetSize) {
	//
	// Daten zuordnen und egalisieren 
	//
	let Region = allItems.features[0].attributes.GEN
	let RegTyp = allItems.features[0].attributes.BEZ
	let LastUpdate = allItems.features[0].attributes.last_update
		LastUpdate = LastUpdate.substr(0, LastUpdate.indexOf(","))
	let Citizen = allItems.features[0].attributes.EWZ
		Citizen = Citizen.toLocaleString('de-DE')
	let Cases = allItems.features[0].attributes.cases
	let Cases7Per100k = allItems.features[0].attributes.cases7_per_100k
		Cases7Per100k = Cases7Per100k.toFixed(2);
	let Deaths = allItems.features[0].attributes.deaths
	
	//
	// Textbausteine
	//
	let SubTitleTxt = RegTyp
	let TitleTxt = Region
	// Content Left   
	let DetailLeftTxt = "Einwohner:\r"
		DetailLeftTxt += "Fälle gesamt:\r"
		DetailLeftTxt += "Verstorben:"
	//  Content Right
	let DetailRightTxt = Citizen + "\r"
		DetailRightTxt += Cases + "\r"
		DetailRightTxt += Deaths
	
	let	InzidenzTitelTxt = "7-Tage-Inzidenz"
	let InzidenzNumberTxt = Cases7Per100k
	
	let FooterTxt = LastUpdate
	
	// 
	// Farben setzen, Hintergrund und Schrift
	// 
	let myGradient = new LinearGradient()
		myGradient.locations = [0.0,1]
	let MainTextColor = new Color("#ffffff")
	let SubTitelColor = new Color("#cccccc")
	let TitelColor = MainTextColor
	let InzidenzTitelColor = new Color("#e5e5e5")
	let warnColor = MainTextColor
	let ContentBGColor = new Color("#00000025")
	let FooterColor = MainTextColor
	
	if (allwaysDark == true || Device.isUsingDarkAppearance()) {
	// console.log("Dark Mode")
		myGradient.colors = [new Color("#000000"), new Color("#222222")]
		TitelColor = new Color("#dddddd")
		MainTextColor = new Color("#aaaaaa")
		InzidenzTitelColor = new Color("#dddddd")
		ContentBGColor = new Color("#ffffff15")
		FooterColor = new Color("#ffffff")
		  if (Cases7Per100k <= Step1st) {
			// Ampel grün
			warnColor = new Color("#33cc33")
		} 
		if (Cases7Per100k > Step1st && Cases7Per100k <= Step2nd ) {
			// Ampel orange
			warnColor = new Color("#ff7700")
		}
		if (Cases7Per100k > Step2nd) {
			// Ampel rot
			warnColor = new Color("#ff0000")
		}  
		if (Cases7Per100k > Step3rd) {
			// Ampel lila
			warnColor = new Color("#9400D3")
		}  			
	} else {
	// console.log("Light Mode")
		if (Cases7Per100k <= Step1st) {
			// Ampel grün
			myGradient.colors = [new Color("#007711"), new Color("#33cc33")]
		} 
		if (Cases7Per100k > Step1st && Cases7Per100k <= Step2nd ) {
			// Ampel orange
			myGradient.colors = [new Color("#ff6000"), new Color("#ffb200")]
		}
		if (Cases7Per100k > Step2nd) {
			// Ampel rot
			myGradient.colors = [new Color("#990000"), new Color("#ff0000")]
		 }  	
		if (Cases7Per100k > Step3rd) {
			// Ampel lila
			myGradient.colors = [new Color("#851684"), new Color("#9400D3")]
		 }  		 
		MainTextColor = new Color("#ffffff")
		warnColor = MainTextColor
	}  
  
  
	 //
	// Widget bauen
	//
	let w = new ListWidget()
	w.backgroundGradient = myGradient
	w.url = "https://npgeo-corona-npgeo-de.hub.arcgis.com"
	  
	// Widget Layout
	
	// SubTitle Stack
	let wSubTitle = w.addStack()
	wSubTitle.size = new Size(widgetSize.width,widgetSize.height*0.10)
	wSubTitle.bottomAlignContent()
	wSubTitle.setPadding(0,4,0,0)	
		let SubTitleOut = wSubTitle.addText(SubTitleTxt)
		SubTitleOut.textColor = SubTitelColor
		SubTitleOut.font = Font.boldSystemFont(10)
		SubTitleOut.minimumScaleFactor = 0.5	
	wSubTitle.addSpacer()  
	// Title Stack
	let wTitle = w.addStack()
	wTitle.size = new Size(widgetSize.width,widgetSize.height*0.15)
	wTitle.centerAlignContent()
	wTitle.setPadding(0,4,0,0)
		let TitleOut = wTitle.addText(TitleTxt)
		TitleOut.textColor = TitelColor
		TitleOut.font = Font.boldSystemFont(20)
		TitleOut.minimumScaleFactor = 0.3
		//wTitle.addSpacer()	
		//addSymbol({
		//	  symbol: 'building.2',
		//	  stack: wTitle,
		//	  color: TitelColor,
		//	  size: 20,
		//	})	
	wTitle.addSpacer()	

	// Content Stack
	let wContent = w.addStack()
	wContent.size = new Size(widgetSize.width,widgetSize.height*0.65)
	wContent.backgroundColor = ContentBGColor
	wContent.cornerRadius = 4
	wContent.layoutVertically()

		let wDetail = wContent.addStack()
		wDetail.size = new Size(widgetSize.width,widgetSize.height*0.35)
		wDetail.layoutHorizontally()
			// ContentLeft Stack
			let wDetailLeft = wDetail.addStack()
			wDetailLeft.size = new Size(widgetSize.width*0.6,widgetSize.height*0.35)
			wDetailLeft.centerAlignContent()
				// Content Left
				let DetailLeftOut = wDetailLeft.addText(DetailLeftTxt)
				DetailLeftOut.textColor = MainTextColor
				DetailLeftOut.rightAlignText()
				DetailLeftOut.font = Font.systemFont(11)
				DetailLeftOut.minimumScaleFactor = 0.5  
			//ContentRight Stack
			let wDetailRight = wDetail.addStack()
			wDetailRight.size = new Size(widgetSize.width*0.4,widgetSize.height*0.35)
			wDetailRight.centerAlignContent()
				// Content Right
				let DetailRightOut = wDetailRight.addText(DetailRightTxt)
				DetailRightOut.textColor = MainTextColor
				DetailRightOut.rightAlignText()
				DetailRightOut.font = Font.systemFont(11)
				DetailRightOut.minimumScaleFactor = 0.5	
		
		// Inzidenz Titel Stack
		let wInzidenzTitel = wContent.addStack()
		wInzidenzTitel.size = new Size(widgetSize.width,widgetSize.height*0.10)
		wInzidenzTitel.bottomAlignContent()
			let InzidenzTitelOut = wInzidenzTitel.addText(InzidenzTitelTxt)
			InzidenzTitelOut.textColor = InzidenzTitelColor
			InzidenzTitelOut.centerAlignText()
			InzidenzTitelOut.font = Font.boldSystemFont(14)
			InzidenzTitelOut.minimumScaleFactor = 0.5    
		// Inzidenz Number Stack
		let wInzidenzNumber = wContent.addStack()
		wInzidenzNumber.size = new Size(widgetSize.width,widgetSize.height*0.20)
		wInzidenzNumber.topAlignContent() 
			let InzidenzNumberOut = wInzidenzNumber.addText(InzidenzNumberTxt.replace(".",","))
			InzidenzNumberOut.textColor = warnColor
			InzidenzNumberOut.centerAlignText()
			InzidenzNumberOut.font = Font.boldSystemFont(24)
			InzidenzNumberOut.minimumScaleFactor = 0.5  
	 
	// FooterStack
	let wFooter = w.addStack()
	wFooter.size = new Size(widgetSize.width,widgetSize.height*0.10)
	wFooter.addSpacer()
	wFooter.setPadding(0,0,0,4)	
		wFooter.bottomAlignContent()  
		let FooterOut = wFooter.addText(" Stand: " + FooterTxt)
		FooterOut.textColor = FooterColor
		FooterOut.font = Font.systemFont(8)
		FooterOut.minimumScaleFactor = 0.5  

	// Rahmen um Stack anzeigen, DebugMode
	if (debugMode){
		wTitle.borderWidth = 1
		wSubTitle.borderWidth = 1
		wDetail.borderWidth = 0
		 wDetailLeft.borderWidth = 1
		 wDetailRight.borderWidth = 1
		wInzidenzTitel.borderWidth = 1
		wInzidenzNumber.borderWidth = 1
		wFooter.borderWidth = 1
	} 

  return w
}

//
// Error Widget
//
function errorWidget(reason){
	let w = new ListWidget()
	w.setPadding(5,5,5,5)
	let myGradient = new LinearGradient()

	w.backgroundColor = new Color("#933")
	myGradient.colors = [new Color("#990000"), new Color("#ff0000")]
	myGradient.locations = [0.0,1]
	w.backgroundGradient = myGradient
	
	
	let title = w.addText("Fehler")
	title.centerAlignText()
	title.textColor = Color.white()
	title.font = Font.semiboldSystemFont(24)
	title.minimumScaleFactor = 0.5
		let reasonText = w.addText(reason)
		reasonText.centerAlignText()
		reasonText.textColor = Color.white()
		reasonText.font = Font.semiboldSystemFont(12)
		reasonText.minimumScaleFactor = 0.5
  
  return w
}

//
// JSON holen
//
async function loadItems() {
	let url ="https://services7.arcgis.com/mOBPykOjAyBO2ZKk/arcgis/rest/services/RKI_Landkreisdaten/FeatureServer/0/query?where=OBJECTID=" + ObjectID + "&outFields=*&outSR=4326&f=json"
	let req = new Request(url)
	let json = await req.loadJSON()
	return json
}

//
// SF Smbole
//
function addSymbol({
  symbol = 'applelogo',
  stack,
  color = Color.white(),
  size = 20,
  imageOpacity = 1,
}) {
  const _sym = SFSymbol.named(symbol)
  const wImg = stack.addImage(_sym.image)
  wImg.tintColor = color
  wImg.imageSize = new Size(size, size)
  wImg.containerRelativeShape = false
  wImg.imageOpacity = imageOpacity
}
