const utils = require('../src/universal-editor-ui-1/actions/utils.js');

test('Test get name from path', async () => {
    const path = '/foo/bar/buzz';
    const result = utils.extractNameFromPath(path);
    expect(result).toEqual({name: 'buzz', path: '/foo/bar'});
})

test('Test get name from path', async () => {
    const path = '/foo/bar/buzz/';
    const result = utils.extractNameFromPath(path);
    expect(result).toEqual({name: 'buzz', path: '/foo/bar'});
})
