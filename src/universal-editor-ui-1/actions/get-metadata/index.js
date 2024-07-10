/*
* <license header>
*/

/**
 * This is a sample action showcasing how to access an external API
 *
 * Note:
 * You might want to disable authentication and authorization checks against Adobe Identity Management System for a generic action. In that case:
 *   - Remove the require-adobe-auth annotation for this action in the manifest.yml of your application
 *   - Remove the Authorization header from the array passed in checkMissingRequestInputs
 *   - The two steps above imply that every client knowing the URL to this deployed action will be able to invoke it without any authentication and authorization checks against Adobe Identity Management System
 *   - Make sure to validate these changes against your security requirements before deploying the action
 */


const { Core } = require('@adobe/aio-sdk');
const fetch = require('node-fetch');
const HTMLParser = require('node-html-parser');
const {
  errorResponse, stringParameters, getBearerToken, checkMissingRequestInputs, getAemHost, getAemHeaders,
} = require('../utils');
const { getProperties } = require('../aem');


// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    // check for missing request input parameters and headers
    const requiredParams = [/* add required params */]
    const requiredHeaders = ['Authorization']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors
      return errorResponse(400, errorMessage, logger)
    }

    const aemHost = getAemHost(params);
    const headers = await getAemHeaders(params);
    const url = params.url;

    const pageHtmlResponse = await fetch(aemHost + url + `.html`, {
      method: 'GET',
      headers: headers,
    }).catch((error) => {
      logger.error(error);
      return {
        statusCode: 200,
        body: {test: "error11"}
      };
    });

    const pageHtml = await pageHtmlResponse.text();
    const tenant = pageHtml.match(/<meta.*name="tenant".*content="(.*)".*\/>/)[1];
    //georegion
    const georegion = pageHtml.match(/<meta.*name="georegion".*content="(.*)".*\/>/)[1];

    const response = {
      statusCode: 200,
      body: {tenant,georegion}
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    // return errorResponse(500, 'server error', logger)
    return {
      statusCode: 200,
      body: logger
    };
  }
}

exports.main = main
