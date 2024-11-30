function getActiveUserIdentifiers() {
  // Acceder a la hoja que contiene la información de pacientes 
  // Obtener los datos como un array de arrays
  // Filtrar para obtener los usuarios activos
  // De los usuarios activos, extraer los datos relevante, en ese caso RUT y correo electrónico

  // Asegurarnos de que los cambios a la hoja que reciba las respuestas del formulario se han aplicado
  SpreadsheetApp.flush()
  // Acceder a la hoja que contiene la información de pacientes 
  const dataSpreadsheetId = PropertiesService.getScriptProperties().getProperty("dataSpreadsheetId")
  const patientsSheet = SpreadsheetApp.openById(dataSpreadsheetId).getSheetByName("Pacientes")
  // Obtener los datos como un array de arrays
  const patientsData = patientsSheet.getRange('A1').getDataRegion().getValues()
  // Filtrar para obtener los usuarios activos
  const activeUsers = patientsData.filter(patientDataRow => patientDataRow[6] === true)
  // De los usuarios activos, extraer los datos relevante, en ese caso RUT y correo electrónico
  const userIdentifiers = activeUsers.map(activeUser => ({rut: activeUser[1], email: activeUser[4]}));
  
  return userIdentifiers
}

function signUpScript() {
  // ✅: Líneas 1-5 de 'triggerInstaller': Instalarle un trigger al formulario de pacientes que ejecuta esta funcion (esta instalación se realiza una sola vez)
  // Hacer el proceso que actualmente realiza authorizeRuts para darle acceso a este RUT a la planilla de Registro Glicemia (buscar valores, confeccionar un regex, vincular regex).
  const activeUsers = getActiveUserData()
  //    IMPORTANTE: Al momento de buscar los RUTs que formarán parte de los Regex chequear la flag de validez un usuario 
  // Hacer el proceso que actualmente realiza authorizeRuts (buscar valores, confeccionar un regex, vincular regex). Quizá con otro nombre, pero invertido, y vincularlo al campo correspondiente de RegistroPacientes! Porque el RUT recién registrado no debería poderse registrar nuevamente
  //    IMPORTANTE: Este regex hay que actualizarlo para que incluya nuevas ideas que se describen en "Fujo Teórico" (google Doc)
  // Hacer el proceso que actualmente realiza authorizaeRuts pero con el correo. Quizá fusionado con el de RUTs? pero invertido!  Porque el email recién registrado no debería poderse registrar nuevamente. Vincular dicho regex al campo correspondiente de RegistroPacientes
  // Crear la copia de la spreadsheet para las pacientes, a partir de una plantilla confeccionada por mí 
  //    Cambiar título
  //    Cambiar segmento ficha
  //    Meter el id de la copia en la tabla "Pacientes"
  // Darles acceso a las pacientes de solo lectura! 
  // Mandarles un correo a las pacientes si es que todo salió bien
  //    Incluir en el correo los links relevantes: Form de Registro Glicemia y la hoja que les pertenece
}