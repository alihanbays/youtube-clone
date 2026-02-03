import { Storage } from "@google-cloud/storage";
import { spawn } from 'node:child_process';
import fs from "fs";

const storage = new Storage;

const rawVideoBucketName = "alihan-yt-clone-raw-bucket";
const processedVideoBucketName = "alihan-yt-clone-processed-bucket";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";

export function setupDirectories() {
    createDirectory(localRawVideoPath);
    createDirectory(localProcessedVideoPath);
}

function createDirectory(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
        console.log(`Created ${path}`);
    }
}

export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject) => {
        const ffmpegArgs = [
            "-i",
            `${localRawVideoPath}/${rawVideoName}`,
            "-vf",
            "scale=-2:360",
            `${localProcessedVideoPath}/${processedVideoName}`
        ];

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
        let stderrOutput = '';

        ffmpegProcess.stderr.on('data', (data) => {
            stderrOutput += data.toString();
        });

        ffmpegProcess.stdin.write('y\n');
        ffmpegProcess.stdin.end();

        ffmpegProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);

            if (code == 0) {
                console.log(`"Successfull!" ${code}`);
                resolve();
            } else {
                console.error(`ffmpeg exited with code ${code}, Error: ${stderrOutput}`);
                reject();
            }
        });
    });
}

export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
        .file(fileName)
        .download({
            destination: `${localRawVideoPath}/${fileName}`
        });
    console.log(`gs://${rawVideoBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`);
}

export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);
    await bucket
        .upload(`${localProcessedVideoPath}/${fileName}`);

    console.log(`gs://${localProcessedVideoPath}/${fileName} uploaded to ${processedVideoBucketName}/${fileName}`);

    bucket.file(fileName).makePublic();
}

export function deleteRawVideo(fileName: string) {
    deleteFile(`${localRawVideoPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string) {
    deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

function deleteFile(filePath: string) : Promise<void> {
    return new Promise<void>((resolve, reject) => {
        if (!fs.existsSync(filePath)) {
            console.log(`deleteFile: ${filePath} doesnt exists!`);
            reject();
        } else {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.log(`deleteFile > fs.unlink : ${err}`);
                }
            })
        }
    });
}