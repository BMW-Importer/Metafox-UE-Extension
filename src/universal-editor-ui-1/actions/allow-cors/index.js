/*
Copyright 2022 Adobe
All Rights Reserved.
NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

const { Core } = require('@adobe/aio-sdk');
const fetch = require('node-fetch');
const {
  errorResponse, stringParameters, getBearerToken, checkMissingRequestInputs, getAemHost, getAemHeaders,
} = require('../utils');
const { getProperties } = require('../aem');


// main function that will be executed by Adobe I/O Runtime
async function main(params) {
    const logger = Core.Logger("main", { level: params.LOG_LEVEL || "info" });
    // check for missing request input parameters and headers

    logger.info('>> token: ', params.authorization);
    const requiredParams = ['url']
    const requiredHeaders = ['authorization', 'x-aem-host', 'x-gw-ims-org-id']
    const errorMessage = checkMissingRequestInputs(params, requiredParams, requiredHeaders)
    if (errorMessage) {
      // return and log client errors6
      return errorResponse(400, errorMessage, logger)
    }

    const imsToken = getBearerToken(params);
    console.log('imsToken:',imsToken);
    logger.info('Getting experiment data from AEM', url)
    const location = new window.URL(window.location);
    const imsOrg = params.__ow_headers['x-gw-ims-org-id'];
    const builtHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${imsToken}`,
        'x-aem-host': `${location.protocol}//${location.host}`,
        'x-gw-ims-org-id': imsOrg,
    };
    const response = await fetch(actions["get-experiment"], {
        method: 'POST',
        headers: builtHeaders,
        body: JSON.stringify({ url: location.pathname })
    });
    console.log('response:',response);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const responseData = await response.json();
  return { statusCode: 200, body: responseData};
}

exports.main = main;
