//
//  AVKitIO.swift
//  swift-pkgs-tmpui
//
//  Created by Jess on 10/7/20.
//

import Foundation
import SwiftUI
import AVKit


struct RecordingView: View {
    @State private var timer = 5
    @State private var onComplete = false
    @State private var recording = false
    
    var body: some View {
        ZStack {
            VideoRecordingView(timeLeft: $timer, onComplete: $onComplete, recording: $recording)
            VStack {
                Button(action: {
                    self.recording.toggle()
                }, label: {
                    Text("Toggle Recording")
                })
                    .foregroundColor(.white)
                    .padding()
                Button(action: {
                    self.timer -= 1
                    print(self.timer)
                }, label: {
                    Text("Toggle timer")
                })
                    .foregroundColor(.white)
                    .padding()
                Button(action: {
                    self.onComplete.toggle()
                }, label: {
                    Text("Toggle completion")
                })
                    .foregroundColor(.white)
                    .padding()
            }
        }
    }
    
}

struct VideoRecordingView: UIViewRepresentable {
    
    @Binding var timeLeft: Int
    @Binding var onComplete: Bool
    @Binding var recording: Bool
    func makeUIView(context: UIViewRepresentableContext<VideoRecordingView>) -> AVPreviewView {
        let recordingView = AVPreviewView()
        recordingView.onComplete = {
            self.onComplete = true
        }
        
        recordingView.onRecord = { timeLeft, totalShakes in
            self.timeLeft = timeLeft
            self.recording = true
        }
        
        recordingView.onReset = {
            self.recording = false
            self.timeLeft = 30
        }
        return recordingView
    }
    
    func updateUIView(_ uiViewController: AVPreviewView, context: UIViewRepresentableContext<VideoRecordingView>) {
        
    }
}

extension PreviewView: AVCaptureFileOutputRecordingDelegate{
    func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
        print(outputFileURL.absoluteString)
    }
}

class AVPreviewView: UIView, AVCaptureFileOutputRecordingDelegate {
    func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL, from connections: [AVCaptureConnection], error: Error?) {
    }
    
    private var captureSession: AVCaptureSession?
    private var shakeCountDown: Timer?
    let videoFileOutput = AVCaptureMovieFileOutput()
    var recordingDelegate:AVCaptureFileOutputRecordingDelegate!
    var recorded = 0
    var secondsToReachGoal = 30
    
    var onRecord: ((Int, Int)->())?
    var onReset: (() -> ())?
    var onComplete: (() -> ())?
    
    init() {
        super.init(frame: .zero)
        
        var allowedAccess = false
        let blocker = DispatchGroup()
        blocker.enter()
        AVCaptureDevice.requestAccess(for: .video) { flag in
            allowedAccess = flag
            blocker.leave()
        }
        blocker.wait()
        
        if !allowedAccess {
            print("!!! NO ACCESS TO CAMERA")
            return
        }
        
        // setup session
        let session = AVCaptureSession()
        session.beginConfiguration()
        
        let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera,
                                                  for: .video, position: .front)
        guard videoDevice != nil, let videoDeviceInput = try? AVCaptureDeviceInput(device: videoDevice!), session.canAddInput(videoDeviceInput) else {
            print("!!! NO CAMERA DETECTED")
            return
        }
        session.addInput(videoDeviceInput)
        session.commitConfiguration()
        self.captureSession = session
    }
    
    override class var layerClass: AnyClass {
        AVCaptureVideoPreviewLayer.self
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    var videoPreviewLayer: AVCaptureVideoPreviewLayer {
        return layer as! AVCaptureVideoPreviewLayer
    }
    
    override func didMoveToSuperview() {
        super.didMoveToSuperview()
        recordingDelegate = self
        if nil != self.superview {
            self.videoPreviewLayer.session = self.captureSession
            self.videoPreviewLayer.videoGravity = .resizeAspect
            self.captureSession?.startRunning()
            self.startRecording()
        } else {
            self.captureSession?.stopRunning()
        }
    }
    
    func startRecording(){
        captureSession?.addOutput(videoFileOutput)
        
        let documentsURL = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let filePath = documentsURL.appendingPathComponent("floofyFile")
        vLog(text: "AVKitIO: Record started @ " + filePath.absoluteString)
        videoFileOutput.startRecording(to: filePath, recordingDelegate: recordingDelegate)
    }
    
    func stopRecording(){
        videoFileOutput.stopRecording()
        vLog(text: "AVKitIO: Record stopped!")
    }
}
