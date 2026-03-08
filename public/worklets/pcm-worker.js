class PcmWorker extends AudioWorkletProcessor {
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input[0]) {
            const inputData = input[0];
            // Convert Float32 to Int16 PCM
            const pcm16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) {
                let s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
            }
            this.port.postMessage(pcm16);
        }
        return true;
    }
}

registerProcessor('pcm-worker', PcmWorker);
