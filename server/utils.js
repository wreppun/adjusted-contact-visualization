module.exports = {
  rename (transforms) {
    return function (raw) {
      const result = Object.assign({}, raw);

      transforms.forEach(({from, to}) => {
        result[to] = result[from];
        delete result[from];
      });

      return result;
    };
  }
};
