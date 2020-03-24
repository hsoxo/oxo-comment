const traverse = (obj, callback) => {
  for (let k in obj) {
    if (obj[k] && typeof obj[k] === 'object') {
      traverse(obj[k])
    } else {
      callback(obj[k])
    }
  }
}

export default traverse
