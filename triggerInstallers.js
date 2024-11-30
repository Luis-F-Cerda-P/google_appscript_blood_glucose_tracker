function signUpFormTriggerInstall() {
  const signUpFormId = PropertiesService.getScriptProperties().getProperty("signUpFormId")
  const form = FormApp.openById(signUpFormId);
  ScriptApp.newTrigger('signUpScript').forForm(form).onFormSubmit().create();
}