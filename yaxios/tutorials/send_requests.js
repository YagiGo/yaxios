const yaxios = require('../lib/yaxios');

yaxios.get({
    url: 'localhost:3000/posts'
})
    .then((res) => console.log(res.data))
    .catch((err) => console.log(err))