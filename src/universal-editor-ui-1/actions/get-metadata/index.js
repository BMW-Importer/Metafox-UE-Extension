/*
Copyright 2022 Adobe
All Rights Reserved.
NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

const { Core } = require('@adobe/aio-sdk');
const fetch = require('node-fetch');
const HTMLParser = require('node-html-parser');
const {
  errorResponse, stringParameters, getBearerToken, checkMissingRequestInputs, getAemHost, getAemHeaders,
} = require('../utils');
const { getProperties } = require('../aem');

const metadataProps = ['carModel', 'carSeries', 'jcr:title', 'jcr:description', 'jcr:image','jcr:tags','jcr:feed','jcr:robots', 'og:title', 'og:description', 'og:image', 'og:tags', 'og:feed', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:tags', 'twitter:feed', 'theme','template'];

async function getMetadataFromAEM(url, aemHost, headers) {
    const properties = await getProperties(url, aemHost, headers, 1);
    const content = properties["jcr:content"];
    const metadata = Object.fromEntries(metadataProps.map((prop) => [prop, content[prop] || '']));

    return metadata; 
} 

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

    const aemHost = getAemHost(params);
    const headers = await getAemHeaders(params);
    const url = params.url;

    logger.info('Getting experiment data from AEM', url)
    // const metadata = await getMetadataFromAEM(url, aemHost, headers);
    // logger.info('Retrieved experiment data', metadata);
    // const experiment = formatExperiment(metadata);

    // if (!metadata.id) {
    //     return { statusCode: 200, body: noExperiment};
    // }

    // if (metadata.status === "inactive") {
    //     return { statusCode: 200, body: noExperiment};
    // }

    return {
      statusCode: 200,
      body: '{}'
    }
}

exports.main = main;
