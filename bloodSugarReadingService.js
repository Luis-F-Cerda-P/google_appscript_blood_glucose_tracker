function bloodSugarReadingScript(formSubmission) {
  function readingCheck(response) {

    // Take the reading 
    console.log("reading: ", reading)

    // According to its value, decide what to do
    switch (true) {
      // Not alarming? => Do nothing
      case reading < 140:
        break;
      case reading >= 140:
        notify()
        // Alarming? => Notify the Dr. via Email, specifying the patient that submitted the reading
        break;
      default:
        break;
    }
    return;
  }

  function notify() {
    const fullName = `${patientInfo[2]} ${patientInfo[3]}`
    const subjectString = "Valor alarmante - " + fullName
    const timeSlot = response['Momento del día']
    const readingDate = response['Fecha']
    // TODO: body should be HTML template.
    const mailBody = `La paciente ${fullName}, RUT ${rut}, registró un nivel de glicemia en sangre de ${reading}. Esta lectura se tomó en ${timeSlot}, el ${readingDate}`
    GmailApp.sendEmail("luiscerdamun@gmail.com", subjectString, mailBody)
  }
  // CURRENTLY DOING: Agarrar el formSubmission y según el valor de la lectura, decidir si mandar o no un correo al Dr. 
  const response = formSubmission.namedValues
  const reading = parseInt(response['Lectura'], 10)
  Logger.log("response: " + response)
  const rut = response['Por favor ingrese su RUT'][0]
  Logger.log("rut: " + rut)

  const patientsSheet = formSubmission.range.getSheet().getParent().getSheetByName("Pacientes")
  const values = patientsSheet.getRange(2, 1, patientsSheet.getLastRow(), patientsSheet.getLastColumn()).getValues().toReversed()
  const patientInfo = values.find(row => row[1] === rut)
  const link = patientInfo[10]


  const responseSpreadsheet = SpreadsheetApp.openByUrl(link)
  const recordsSheet = responseSpreadsheet.getSheetByName("Registros Glicemia")
  recordsSheet.insertRowAfter(5).getRange(6, 1, 1, 5).setValues([formSubmission.values])

  readingCheck(response)
}