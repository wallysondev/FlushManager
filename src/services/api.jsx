import axios from 'axios';

const Api = axios.create({
    baseURL: "http://localhost:7296/api/"
})

export default Api