// https://medium.com/prolanceer/optimizing-react-app-performance-using-web-workers-79266afd4a7

export default class WebWorker {
    constructor(worker) {
        const code = worker.toString();
        const blob = new Blob(['('+code+')()']);
        return new Worker(URL.createObjectURL(blob));
    }
}
