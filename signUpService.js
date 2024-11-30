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
  // Obtener los datos como un array de arrays. Se invierten para que estén desde el más reciente al más antiguo, ya que en la hoja se guardan de más antiguo a más reciente
  const patientsDataNewestToOldest = patientsSheet.getRange('A1').getDataRegion().getValues().toReversed()
  // Filtrar para obtener los usuarios activos, tomando en cuenta únicamente el registro más reciente si es que algún rut o email se repite
  const uniqueEmails = new Set()
  const uniqueRuts = new Set()
  const uniqueActiveUsers = patientsDataNewestToOldest.reduce((accumulatorUniqueActiveUsers, currentPatientDataRow) => {
    const curPatientRut = currentPatientDataRow[1]
    const curPatientEmail = currentPatientDataRow[4]
    
    if (
      !uniqueRuts.has(curPatientRut) &&
      !uniqueEmails.has(curPatientEmail) &&
      currentPatientDataRow[6] === true
    ) {
      uniqueRuts.add(curPatientRut)
      uniqueEmails.add(curPatientEmail)
      accumulatorUniqueActiveUsers.push(currentPatientDataRow)
    }

    return accumulatorUniqueActiveUsers
  }, [])

  // De los usuarios activos, extraer los datos relevantes, en ese caso RUT y correo electrónico
  const userIdentifiers = uniqueActiveUsers.map(activeUser => ({rut: activeUser[1], email: activeUser[4]}));
  
  return userIdentifiers
}

function signUpScript() {
  // ✅: Líneas 1-5 de 'triggerInstaller': Instalarle un trigger al formulario de pacientes que ejecuta esta funcion (esta instalación se realiza una sola vez)
  // Hacer el proceso que actualmente realiza authorizeRuts para darle acceso a este RUT a la planilla de Registro Glicemia (buscar valores, confeccionar un regex, vincular regex).
  const activeUsers = getActiveUserIdentifiers()
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