function signUpFormTriggerInstall() {
  const signUpFormId = PropertiesService.getScriptProperties().getProperty("signUpFormId")
  const form = FormApp.openById(signUpFormId);
  ScriptApp.newTrigger('signUpScript').forForm(form).onFormSubmit().create();
}

function spreadsheetFormSubmitTrigger() {
  const dataSheetId = PropertiesService.getScriptProperties().getProperty("dataSpreadsheetId")
  const spreadsheet = SpreadsheetApp.openById(dataSheetId);
  ScriptApp.newTrigger('signUpScript')
    .forSpreadsheet(spreadsheet)
    .onFormSubmit()
    .create();
}