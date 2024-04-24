function createFormData(rawData) {
  const f = new FormData();

  for (const [key, value] of Object.entries(rawData)) {
    f.append(key, value);
  }
  return f;
}

async function getProperties(path, aemHost, headers, level = 0) {
  const response = await fetch(aemHost + path + `.${level}.json`, {
    method: 'GET',
    headers: headers,
  })

  if (!response.ok) {
    return false;
  }

  return await response.json();
}

async function updateProperties(properties, path, aemHost, imsToken) {
  const response = await fetch(aemHost + path + '/_jcr_content', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${imsToken}`,
    },
    body: createFormData(properties)
  })

  return response;
}


module.exports = {
  getProperties,
  updateProperties,
}