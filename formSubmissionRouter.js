function formSubmissionRouter(formSubmitEvent) {
  const submissionDestinatioName = formSubmitEvent.range.getSheet().getName()

  switch (submissionDestinatioName) {
    case "Pacientes":
      signUpScript(formSubmitEvent)
      break;
    case "Registros Glicemia":
      bloodSugarReadingScript(formSubmitEvent)
      break;
  
    default:
      break;
  }
}