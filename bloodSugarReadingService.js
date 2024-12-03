function bloodSugarReadingScript(formSubmission) {
  const response = formSubmission.namedValues
  Logger.log("response: " + response)
  const rut = response['Por favor ingrese su RUT'][0]
  Logger.log("rut: " + rut)
  const patientsSheet = formSubmission.range.getSheet().getParent().getSheetByName("Pacientes")
  const values = patientsSheet.getRange(2, 1, patientsSheet.getLastRow(), patientsSheet.getLastColumn()).getValues().toReversed()
  const link = values.find(row => row[1] === rut)[10]

  const responseSpreadsheet = SpreadsheetApp.openByUrl(link)
  const recordsSheet = responseSpreadsheet.getSheetByName("Registros Glicemia")
  recordsSheet.insertRowAfter(5).getRange(6, 1, 1, 5).setValues([formSubmission.values])
}