// Reference the elements that we will need
import { samples } from './sample.js'

const status = document.getElementById("status");
const textInput = document.getElementById("text-input");
const labelsInput = document.getElementById("labels-input");

const detectButton = document.getElementById("detect-button");
const resultContainer = document.getElementById("result");

status.textContent = "모델 로딩 중... (5초 ~ 30초 소요)";


const worker = new Worker('./worker.js', { type: 'module' });

textInput.value = samples.trim();

worker.postMessage({
    type: 'loadModel'
})

function chunkArray(array, chunkSize) {
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

worker.onmessage = (event) => {
    if (event.data.type === 'modelLoaded') {
        status.textContent = "준비 완료.";
        detectButton.disabled = false;
    } else if (event.data.type === 'result') {
        status.textContent = "분석 중...";
        const { result, isLastChunk } = event.data;
        console.log(result);
        const mostLikelyLabel = result.labels[0];
        const mostLikelyScore = result.scores[0];

        resultContainer.innerHTML += `<div class="result-item">
            <h3>텍스트: ${result.sequence}</h3>
            <h4>추측: ${mostLikelyLabel} (점수: ${(mostLikelyScore * 100).toFixed(1)}%)</h4>
            ${result.labels.map((label, index) => `${label}: ${(result.scores[index] * 100).toFixed(1)}%`).join("<br>")}
        </div>`;

        if (isLastChunk) {
            status.textContent = "분석 완료.";
            detectButton.disabled = false;
        }

    }
}


detectButton.addEventListener("click", async () => {
    resultContainer.innerHTML = "";
    const text = textInput.value;

    /**
     * @type {string[]}
     */
    const textsSplitByNewline = text.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const chunkedTexts = chunkArray(textsSplitByNewline, 2);
    const labels = labelsInput.value.split(",").map((label) => label.trim());

    if (textsSplitByNewline.length > 0 && labels.length > 0) {
        detectButton.disabled = true;
        status.textContent = "분석 중...";
        for (const text of chunkedTexts) {
            const isLastChunk = text === chunkedTexts[chunkedTexts.length - 1];
            worker.postMessage({
                type: 'detect',
                text: text.join("\n"),
                labels: labels,
                isLastChunk: isLastChunk
            });
        }
    } else {
        status.textContent = "텍스트와 라벨을 입력해 주세요.";
    }
});