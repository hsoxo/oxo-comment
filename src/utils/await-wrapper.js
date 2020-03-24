const awaitWrapper = (promise) => {
  return promise
    .then(data => [null, data])
    .catch(err => [err, null])
}

module.exports = awaitWrapper