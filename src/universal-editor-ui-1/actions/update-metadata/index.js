/*
Copyright 2022 Adobe
All Rights Reserved.
NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it.
*/

const { Core } = require('@adobe/aio-sdk');
const HTMLParser = require('node-html-parser');
const {
  errorResponse, stringParameters, getBearerToken, checkMissingRequestInputs, getAemHost, getAemHeaders,
} = require('../utils');
const { getProperties, updateProperties } = require('../aem');

// const defaultExperimentProperties = ['audience', 'split', 'variants'];
// const noExperiment = {status: "inactive"};

// const customSplitStrategy = (split) => {
//     return (variant, index) => {
//         return {
//             name: variant,
//             split: parseInt(split[index]),
//         }
//     }
// }

// const defaultSplitStrategy = (floatSplit) => {
//     return (variant, index) => {
//         return {
//             name: variant,
//             split: (index % 2 === 0) ? Math.floor(floatSplit) : Math.ceil(floatSplit),
//         }
//     }
// }

// function assignSplit(experiment, strategy) {
//     experiment.challengers = experiment.variants.map(strategy)
//     const controlSplit = 100 - experiment.challengers.reduce((acc, cur) => {return acc + cur.split}, 0);
//     experiment.challengers.push({name: 'control', split: controlSplit})

//     delete experiment.split;
//     delete experiment.variants;
// }

// async function asyncGetEDSExperiment(url) {
//     const response = await fetch(url);
//     if (!response.ok) {
//         return noExperiment
//     }

//     const body = await response.text();
//     var root = HTMLParser.parse(body);
//     var metas = root.querySelectorAll('meta');
//     const experiment = {};

//     metas.forEach((element) => {
//         if (!('name' in element.rawAttributes)) {
//             return
//         }

//         if (element.rawAttributes.name === 'experiment') {
//             experiment['id'] = element.rawAttributes.content
//             return;
//         }

//         if (element.rawAttributes.name.startsWith('experiment-')) {
//             const name = element.rawAttributes.name.replace('experiment-', '')

//             let content;
//             if (name === 'variants' || name === 'split' || name === 'audience') {
//                 content = element.rawAttributes.content.split(',');
//             } else {
//                 content = element.rawAttributes.content;
//             }

//             experiment[name] = content
//         }
//     })

//     defaultExperimentProperties.forEach((name) => {
//         if (!experiment[name]) {
//             experiment[name] = []
//         }
//     })

//     if (experiment.id && !experiment.status && experiment.variants.length >= 1) {
//         experiment.status = 'active'
//     }

//     return experiment;
// }

// function cleanPathFromChallengers(experiment) {
//     const cleanChallengers = experiment.challengers.map((challenger) => {
//         const newName = challenger.name.split('/').pop(-1);

//         return {name: newName, split: challenger.split}
//     })

//     experiment.challengers = cleanChallengers;
// }

const metadataProps = ['jcr:title', 'og:title', 'og:description', 'og:image', 'og:tags', 'og:feed', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:tags', 'twitter:feed'];

async function getMetadataFromAEM(url, aemHost, headers) {
    const properties = await getProperties(url, aemHost, headers, 1);
    const content = properties['jcr:content'];


    //og: and twitter: the well known metadata properties include Title, Description, Image, Tags and Feed
    const metadata = {
      'jcr:title': content['jcr:title'],
    };

    // experiment.id = content.experiment || false;
    // experiment.status = content.experimentStatus || 'active';
    // experiment.variants = content.experimentVariants || [];
    // experiment.split = content.experimentSplit || [];

    // if ('experimentStart' in content && 'experimentEnd' in content) {
    //     const startDate = new Date(content.experimentStart);
    //     const endDate = new Date(content.experimentEnd);

    //     experiment.range = {
    //         start: startDate.toISOString().split('T')[0],
    //         end: endDate.toISOString().split('T')[0],
    //     }
    // }

    return metadata; //return
}   

async function updateMetadata(aemHost, imsToken, path, metadata) {
 
  // const experimentFormData = {
  //   'experiment': experiment.id,
  //   'experimentVariants': franklinVariants,
  //   'experimentSplit': franklinSplit,
  //   'experimentStatus': 'active',
  // }

  // if (experiment.range) {
  //   experimentFormData['experimentStart@TypeHint'] = 'Date';
  //   experimentFormData.experimentStart = experiment.range.start;
  //   experimentFormData['experimentEnd@TypeHint'] = 'Date';
  //   experimentFormData.experimentEnd = experiment.range.end;
  // }

  return updateProperties(metadata, path, aemHost, imsToken)
}

// function formatExperiment(experiment) {
//     if (experiment.split.length === experiment.variants.length) {
//         strategy = customSplitStrategy(experiment.split)
//     } else {
//         strategy = defaultSplitStrategy(100 / (experiment.variants.length + 1));
//     }

//     assignSplit(experiment, strategy);
//     cleanPathFromChallengers(experiment);

//     return experiment
// }

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
    const aemHost = getAemHost(params);
    const headers = await getAemHeaders(params);
    const url = params.url;
    const metadata = params.metadata;

    logger.info('Getting experiment data from AEM', url)
    const result = await updateMetadata(aemHost, imsToken, url, metadata);
    logger.info('updated experiment data', metadata);
    // const experiment = formatExperiment(metadata);
 
    // if (!metadata.id) {
    //     return { statusCode: 200, body: noExperiment};
    // }

    // if (metadata.status === "inactive") {
    //     return { statusCode: 200, body: noExperiment};
    // }

    return { statusCode: 200, body: result}; 
}

exports.main = main;
