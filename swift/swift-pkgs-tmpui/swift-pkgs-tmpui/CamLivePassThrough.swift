//
//  CamLivePassThrough.swift
//  swift-pkgs-tmpui
//
//  Created by Jess on 10/4/20.
//

import AVFoundation
import Accelerate
import Foundation
import SwiftUI
import MobileCoreServices
import AVKit

class PreviewView: UIView {
    private var captureSession: AVCaptureSession?

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
            print("No Camera Available!")
            return
        }

        // setup session
        let session = AVCaptureSession()
        session.beginConfiguration()

        let videoDevice = AVCaptureDevice.default(.builtInWideAngleCamera,
            for: .video, position: .unspecified) //alternate AVCaptureDevice.default(for: .video)
        guard videoDevice != nil, let videoDeviceInput = try? AVCaptureDeviceInput(device: videoDevice!), session.canAddInput(videoDeviceInput) else {
            print("No Video device input Available!")
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

        if nil != self.superview {
            self.videoPreviewLayer.session = self.captureSession
            self.videoPreviewLayer.videoGravity = .resizeAspect
            self.captureSession?.startRunning()
        } else {
            self.captureSession?.stopRunning()
        }
    }
}
struct PreviewHolder: UIViewRepresentable {
    func makeUIView(context: UIViewRepresentableContext<PreviewHolder>) -> PreviewView {
        PreviewView()
    }

    func updateUIView(_ uiView: PreviewView, context: UIViewRepresentableContext<PreviewHolder>) {
    }

    typealias UIViewType = PreviewView
}

struct VStreaming: View {
    var body: some View {
        VStack {
            PreviewHolder()
        }.frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity, alignment: .center)
    }
}
