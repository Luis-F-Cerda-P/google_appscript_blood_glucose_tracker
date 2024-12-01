function formSubmissionRouter(formSubmitEvent) {
  const submissionDestinatioName = formSubmitEvent.range.getSheet().getName()

  switch (submissionDestinatioName) {
    case "Pacientes":
      signUpScript(formSubmitEvent)
      break;
  
    default:
      break;
  }
}