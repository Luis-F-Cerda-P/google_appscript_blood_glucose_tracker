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
  const rowsExcludingHeaders = patientsSheet.getLastRow() - 1
  const patientsDataNewestToOldest = patientsSheet.getRange(2, 1, rowsExcludingHeaders, patientsSheet.getLastColumn()).getValues().toReversed()
  // Filtrar para obtener los usuarios activos, tomando en cuenta únicamente el registro más reciente si es que algún rut o email se repite
  const uniqueEmails = new Set()
  const uniqueRuts = new Set()
  const uniqueActiveUsers = patientsDataNewestToOldest.reduce((accumulatorUniqueActiveUsers, currentPatientDataRow) => {
    const curPatientRut = currentPatientDataRow[1]
    const curPatientEmail = currentPatientDataRow[4]

    if (
      !uniqueRuts.has(curPatientRut) &&
      !uniqueEmails.has(curPatientEmail) &&
      currentPatientDataRow[11] === true
    ) {
      uniqueRuts.add(curPatientRut)
      uniqueEmails.add(curPatientEmail)
      accumulatorUniqueActiveUsers.push(currentPatientDataRow)
    }

    return accumulatorUniqueActiveUsers
  }, [])

  // De los usuarios activos, extraer los datos relevantes, en ese caso RUT y correo electrónico
  const userIdentifiers = uniqueActiveUsers.map(activeUser => ({ rut: activeUser[1], email: activeUser[4] }));

  return userIdentifiers
}

function generateRutAuthorizationRegexString(activeUsers) {
  const authorizedRutsPattern = activeUsers.reduce((accumulator, current, index) => { 

    const rut = current.rut
    const digit = rut.slice(-1)
    let rutForPush
    // Make the Rut-regex-check case insensitive in case the verifier is the letter K
    if (digit === "k" || digit === "K") {
      rutForPush = rut.slice(0, -1) + "[kK]"
    }
    else {
      rutForPush = rut
    }

    accumulator.push(rutForPush)

    return accumulator
  }, [])

  const rutAuthorizationRegexString = "^(" + authorizedRutsPattern.join("|") + ")$"

  return rutAuthorizationRegexString
}

function setRutAuthorizationPattern(authorizedRutsPattern) {
  // 1. Abrir Form de registros de glicemia
  const glucoseLevelsFormId = PropertiesService.getScriptProperties().getProperty("glucoseLevelsFormId")
  const glucoseLevelsForm = FormApp.openById(glucoseLevelsFormId)
  // 2. Buscar el input de los RUTS
  const rutAccessInput = glucoseLevelsForm.getItemById(2108204445).asTextItem();
  // 3. Meterle la 'cadena de validacion-RUTS' para PERMITIR que pasen los autorizados
  const textValidation = FormApp.createTextValidation()
    .setHelpText('Su RUT no se encuentra registrado')
    .requireTextMatchesPattern(authorizedRutsPattern)
    .build();

  rutAccessInput.setValidation(textValidation);
}

function createAndConnectDestinationForUserResponse(submittedResponse) {
  function sendEmailSignUpNotification(userCopyUrl, userfileName, userEmail) {
    GmailApp.createDraft(
      userEmail,
      userfileName,
      'Gracias por registrarse,\n\nEn el siguiente link podrá ingresar con su RUT y registrar sus lecturas de glicemia:\nhttps://docs.google.com/forms/d/e/1FAIpQLSfv6IqWeb2lDFJjsVC-PKx96UQZkuT1KYk58BPQ_KnAlYo5zQ/viewform\n\nPor favor guarde el enlace al formulario en \'Favoritos\', o marque este correo como importante para conseguirlo fácilmente en el futuro\n\nTome en cuenta que las lecturas que se realizan después de alguna comida deben tomarse sesenta (60) mins después de comer\n\nEncontrará un resumen de sus respuestas en el siguiente archivo: \n' + `<a href=${userCopyUrl}>Reporte de mis lecturas</a>`,
      {
        name: 'Correo Automático - Registro Exitoso',
        htmlBody: 'Gracias por registrarse,<br><br>En el siguiente link podrá ingresar con su RUT y registrar sus lecturas de glicemia:<br>' + "<a href=\"https://docs.google.com/forms/d/e/1FAIpQLSfv6IqWeb2lDFJjsVC-PKx96UQZkuT1KYk58BPQ_KnAlYo5zQ/viewform\">Cargar una lectura de glicemia</a>" + '<br><br>Por favor guarde el enlace al formulario en \'Favoritos\', o marque este correo como importante para conseguirlo fácilmente en el futuro<br><br>Tome en cuenta que las lecturas que se realizan después de alguna comida deben tomarse sesenta (60) mins después de comer<br><br>Encontrará un resumen de sus respuestas en el siguiente archivo: <br><br>' + `<a href="${userCopyUrl}">Reporte de mis lecturas</a>`
      },
    ).send()
  }
  // 1. Get the Spreadsheet template 
  const spreadsheetTemplateId = PropertiesService.getScriptProperties().getProperty("spreadsheetTemplateId")
  const spreadsheetTemplate = SpreadsheetApp.openById(spreadsheetTemplateId)
  // 2. Copy it 
  const userInfo = submittedResponse.namedValues
  const userFullName = userInfo['Nombre'][0] + " " + userInfo['Apellido'][0]
  Logger.log(userInfo);
  const userfileName = `${userInfo['RUT'][0]}, ${userFullName}, Registros Glicemia`
  const userCopy = spreadsheetTemplate.copy(userfileName)
  const userCopyId = userCopy.getId()
  const userCopyAsDriveFile = DriveApp.getFileById(userCopyId)
  const patientFilesFolderId = PropertiesService.getScriptProperties().getProperty("patientFilesFolderId")
  const patienFilesFolder = DriveApp.getFolderById(patientFilesFolderId)
  userCopyAsDriveFile.moveTo(patienFilesFolder)
  // 3. Replace specific data with data in the response 
  userCopy.getSheetByName("Paciente").getRange(2, 1, 1, 6).setValues([submittedResponse.values])
  // const reportName = userCopy.getSheetByName("Cálculos").getRange(3,3).setValue()
  // const reportRut = userCopy.getSheetByName("Cálculos").getRange(3, 6).setValue(userInfo['RUT'][0])
  // 4. Get the link for the copy 
  const userCopyUrl = userCopy.getUrl()
  // 5. Add it to the 'Pacientes' file 
  const patientsSheet = submittedResponse.range.getSheet()
  const responseRange = submittedResponse.range
  const responseRow = responseRange.getRow()
  const urlColumn = responseRange.getColumn() + responseRange.getWidth() + 4
  const activeFlagColumn = responseRange.getColumn() + responseRange.getWidth() + 3
  const urlCell = patientsSheet.getRange(responseRow, urlColumn)
  const activeFlagCell = patientsSheet.getRange(responseRow, activeFlagColumn)

  activeFlagCell.insertCheckboxes()
    .check();
  urlCell.setValue(userCopyUrl)
  // 6. Share it with the user with 'read' access
  userCopy.addViewer(userInfo['Dirección de correo electrónico'][0])
  // 7. Notify them via email ? 
  const userEmail = userInfo['Dirección de correo electrónico'][0]
  sendEmailSignUpNotification(userCopyUrl, userfileName, userEmail)
}

function activeUsersUpdateScript() {
  const activeUsers = getActiveUserIdentifiers()
  //   Crear la 'cadena de validacion-RUTS' 
  const authorizedRutsPattern = generateRutAuthorizationRegexString(activeUsers)
  //   Crear la 'cadena de validacion-EMAILS' => No 
  // 2. Agregar la cadena validación al input correcto: 
  setRutAuthorizationPattern(authorizedRutsPattern)
}

function signUpScript(submittedResponse) {
  // ✅: Líneas 1-5 de 'triggerInstaller': Instalarle un trigger al formulario de pacientes que ejecuta esta funcion (esta instalación se realiza una sola vez)
  // Obtener usuarios válidos y activos
  //    IMPORTANTE: Al momento de buscar los RUTs que formarán parte de los Regex chequear la flag de validez un usuario 
  // Hacer el proceso que actualmente realiza authorizeRuts para darle acceso a este RUT a la planilla de Registro Glicemia (buscar valores, confeccionar un regex, vincular regex).

  // 1. Crear la cadena de regex correcta:
  //   Buscar los datos
  createAndConnectDestinationForUserResponse(submittedResponse)
  SpreadsheetApp.flush()
  activeUsersUpdateScript()
  // 3. Crear y conectar con la aplicación la copia del documento de Excel para nuevos usuarios 


  // 5. Abrir form de registros de pacientes  => No! Google Forms no permite chequear exclusión y coincidencia de un mismo input, por lo que estamos limitados a escoger entre validar que ingresan un correo o rut válido (por medio de Regex) o ver si ingresan valor que ya existe en la hoja donde guardamos los datos. Entre estas dos, prefiero validar si la información es válida antes de si es o no repetida. 
  // 6. Buscar el input de los RUTS => No! Google Forms no permite chequear exclusión y coincidencia de un mismo input, por lo que estamos limitados a escoger entre validar que ingresan un correo o rut válido (por medio de Regex) o ver si ingresan valor que ya existe en la hoja donde guardamos los datos. Entre estas dos, prefiero validar si la información es válida antes de si es o no repetida. 
  // 7. Meterle la 'cadena de validacion-RUTS' para PROHIBIR que pasen los que ya están registrados => No! Google Forms no permite chequear exclusión y coincidencia de un mismo input, por lo que estamos limitados a escoger entre validar que ingresan un correo o rut válido (por medio de Regex) o ver si ingresan valor que ya existe en la hoja donde guardamos los datos. Entre estas dos, prefiero validar si la información es válida antes de si es o no repetida. 
  // 8. Buscar el input de los EMAILS => No! Google Forms no permite chequear exclusión y coincidencia de un mismo input, por lo que estamos limitados a escoger entre validar que ingresan un correo o rut válido (por medio de Regex) o ver si ingresan valor que ya existe en la hoja donde guardamos los datos. Entre estas dos, prefiero validar si la información es válida antes de si es o no repetida. 
  // 9. Meterle la 'cadena de validacion-EMAILS' para PROHIBIR que pasen los que ya están registrados => No! Google Forms no permite chequear exclusión y coincidencia de un mismo input, por lo que estamos limitados a escoger entre validar que ingresan un correo o rut válido (por medio de Regex) o ver si ingresan valor que ya existe en la hoja donde guardamos los datos. Entre estas dos, prefiero validar si la información es válida antes de si es o no repetida. 

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

function activeUsersManualChange(event) {
  // Tomar el evento
  Logger.log("event.range.getSheet().getName(): ")
  Logger.log(event.range.getSheet().getName())
  if (event.range.getSheet().getName() !== 'Pacientes') return
  Logger.log("event.range.getColumn(): ")
  Logger.log(event.range.getColumn())
  if (event.range.getColumn() !== 10) return
  Logger.log("event.range.getRow(): ")
  Logger.log(event.range.getRow())
  if (event.range.getRow() === 1) return

  activeUsersUpdateScript();
}