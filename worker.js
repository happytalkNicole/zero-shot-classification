import {
    pipeline,
    env
} from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1";

env.allowLocalModels = false;

let classifier;

self.onmessage = async (event) => {
    if (event.data.type === 'loadModel') {
        classifier = await pipeline(
            "zero-shot-classification",
            // "Xenova/mDeBERTa-v3-base-xnli-multilingual-nli-2mil7",
            "xenova/mobilebert-uncased-mnli",
            {
                dtype: "q8",
            }
        );
        self.postMessage({ type: 'modelLoaded' });
    } else if (event.data.type === 'detect') {
        const { text, labels, isLastChunk } = event.data;
        const result = await classifier(text, labels);
        console.log({ result });

        self.postMessage({ type: 'result', result, isLastChunk });
    }
}