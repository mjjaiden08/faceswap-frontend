class FaceSwapAI {
    constructor() {
        this.faceImage = null;
        this.video = null;
        this.resultVideo = null;
        this.faceCanvas = null;
        this.videoCtx = null;
        this.resultCtx = null;
        
        this.init();
    }

    init() {
        this.faceInput = document.getElementById('faceInput');
        this.videoInput = document.getElementById('videoInput');
        this.swapBtn = document.getElementById('swapBtn');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.facePreview = document.getElementById('facePreview');
        this.videoPreview = document.getElementById('videoPreview');
        this.resultPreview = document.getElementById('resultPreview');
        this.downloadSection = document.getElementById('downloadSection');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resultPlaceholder = document.getElementById('resultPlaceholder');

        this.faceCanvas = document.createElement('canvas');
        this.videoCtx = this.faceCanvas.getContext('2d');

        this.bindEvents();
        console.log(terhubung)
    }

    bindEvents() {
        this.faceInput.addEventListener('change', (e) => this.handleFaceUpload(e));
        this.videoInput.addEventListener('change', (e) => this.handleVideoUpload(e));
        this.swapBtn.addEventListener('click', () => this.startFaceSwap());
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
    }

    handleFaceUpload(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.faceImage = new Image();
                this.faceImage.onload = () => {
                    this.renderFacePreview();
                    this.updateSwapButton();
                    document.getElementById('faceUpload').classList.add('valid');
                };
                this.faceImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    handleVideoUpload(e) {
        const file = e.target.files[0];
        if (file) {
            this.videoPreview.src = URL.createObjectURL(file);
            this.videoPreview.onloadeddata = () => {
                this.updateSwapButton();
                document.getElementById('videoUpload').classList.add('valid');
            };
        }
    }

    renderFacePreview() {
        const canvas = document.getElementById('facePreview');
        const ctx = canvas.getContext('2d');
        canvas.width = this.faceImage.width;
        canvas.height = this.faceImage.height;
        ctx.drawImage(this.faceImage, 0, 0);
    }

    updateSwapButton() {
        this.swapBtn.disabled = !(this.faceImage && this.videoPreview.src);
    }

    async startFaceSwap() {
        if (!this.faceImage || !this.videoPreview.src) return;

        this.swapBtn.disabled = true;
        this.progressContainer.style.display = 'block';
        this.downloadSection.style.display = 'none';
        this.resultPreview.style.display = 'none';
        this.resultPlaceholder.style.display = 'flex';

        try {
            await this.processFaceSwap();
        } catch (error) {
            console.error('Face swap error:', error);
            this.progressText.textContent = 'Error: Gagal memproses video';
            this.progressFill.style.width = '0%';
        } finally {
            this.swapBtn.disabled = false;
        }
    }

    async processFaceSwap() {
        const video = this.videoPreview;
        video.currentTime = 0;
        await video.play();

        // Buat canvas untuk result
        const resultCanvas = document.createElement('canvas');
        const resultCtx = resultCanvas.getContext('2d');
        resultCanvas.width = video.videoWidth;
        resultCanvas.height = video.videoHeight;

        // Deteksi wajah dari foto sumber
        const sourceFace = await this.detectFace(this.faceImage);
        if (!sourceFace) {
            throw new Error('Wajah tidak terdeteksi di foto sumber');
        }

        const stream = resultCanvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            this.resultVideo = URL.createObjectURL(blob);
            this.resultPreview.src = this.resultVideo;
            this.resultPreview.style.display = 'block';
            this.resultPlaceholder.style.display = 'none';
            this.downloadSection.style.display = 'block';
            video.pause();
        };

        mediaRecorder.start();

        // Proses frame by frame
        const processFrame = async () => {
            if (video.ended || mediaRecorder.state === 'inactive') return;

            resultCtx.drawImage(video, 0, 0);

            // Deteksi wajah di frame video
            const targetFaces = await this.detectFaces(video);
            
            if (targetFaces.length > 0) {
                const targetFace = targetFaces[0]; // Ambil wajah pertama
                this.swapFace(resultCtx, sourceFace, targetFace, resultCanvas.width, resultCanvas.height);
            }

            // Update progress
            const progress = (video.currentTime / video.duration) * 100;
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `Memproses... ${Math.round(progress)}%`;

            requestAnimationFrame(processFrame);
        };

        processFrame();

        // Stop recording setelah selesai atau max 60 detik
        const maxDuration = 60000;
        setTimeout(() => {
            mediaRecorder.stop();
        }, Math.min(video.duration * 1000, maxDuration));
    }

    detectFace(image) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);

            // Simulasi deteksi wajah - di real app gunakan MediaPipe atau TensorFlow.js
            const faceData = {
                x: canvas.width * 0.2,
                y: canvas.height * 0.2,
                width: canvas.width * 0.6,
                height: canvas.height * 0.6
            };
            resolve(faceData);
        });
    }

    detectFaces(video) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            // Simulasi multiple face detection
            const faces = [{
                x: canvas.width * 0.3,
                y: canvas.height * 0.3,
                width: canvas.width * 0.3,
                height: canvas.height * 0.4
            }];
            resolve(faces);
        });
    }

    swapFace(ctx, sourceFace, targetFace, canvasWidth, canvasHeight) {
        // Extract source face
        const sourceCanvas = document.createElement('canvas');
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCanvas.width = sourceFace.width;
        sourceCanvas.height = sourceFace.height;
        sourceCtx.drawImage(this.faceImage, 
            sourceFace.x, sourceFace.y, sourceFace.width, sourceFace.height,
            0, 0, sourceFace.width, sourceFace.height
        );

        // Resize source face to target size
        const resizedCanvas = document.createElement('canvas');
        const resizedCtx = resizedCanvas.getContext('2d');
        resizedCanvas.width = targetFace.width;
        resizedCanvas.height = targetFace.height;
        resizedCtx.drawImage(sourceCanvas, 0, 0, sourceFace.width, sourceFace.height,
            0, 0, targetFace.width, targetFace.height);

        // Blend face ke target
        ctx.globalAlpha = 0.9;
        ctx.drawImage(resizedCanvas, targetFace.x, targetFace.y);

        // Smooth blending
        ctx.globalAlpha = 1.0;
        
        // Tambah lighting adjustment
        const imageData = ctx.getImageData(targetFace.x, targetFace.y, targetFace.width, targetFace.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = data[i] * 1.1;     // Red
            data[i + 1] = data[i + 1] * 1.05; // Green
            data[i + 2] = data[i + 2] * 1.02; // Blue
        }
        ctx.putImageData(imageData, targetFace.x, targetFace.y);
    }

    downloadResult() {
        const link = document.createElement('a');
        link.href = this.resultVideo;
        link.download = 'face-swap-hd.webm';
        link.click();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new FaceSwapAI();
});