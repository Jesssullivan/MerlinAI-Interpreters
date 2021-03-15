/*
 
This file wraps AudioSpectrogram's CALayer & UIViewController
to conform as a View in SwiftUI.
 
// @ swift-pkgs-tmpui
// created by Jess
 
*/

import Foundation
import SwiftUI
import AVFoundation
import Accelerate


// MARK: - Utility UIViewController --> SwiftUI View Components
/// - ...to wrap Apple's example AudioSpectrogram CALayer & UIViewController within SwiftUI View `SpectrogramView()`
/// Docs @ https://developer.apple.com/documentation/accelerate/visualizing_sound_as_an_audio_spectrogram

private class SpecController: UIViewController {

    /// The audio spectrogram layer.
    let audioSpectrogram = AudioSpectrogram()
    
    override func viewDidLoad() {
        super.viewDidLoad()

        audioSpectrogram.contentsGravity = .resize
        view.layer.addSublayer(audioSpectrogram)
  
        view.backgroundColor = .black
        
        audioSpectrogram.startRunning()
    }

    override func viewDidLayoutSubviews() {
        audioSpectrogram.frame = view.frame
    }
    
    override var prefersHomeIndicatorAutoHidden: Bool {
        true
    }
    
    override var prefersStatusBarHidden: Bool {
        true
    }
}


private struct _SpecViewer: UIViewControllerRepresentable {
    func makeUIViewController(context: UIViewControllerRepresentableContext<_SpecViewer>) -> UIViewController {
        let spec = SpecController()
        return spec
    }
   
    // update function is not used, required by protocol `UIViewControllerRepresentable`
    func updateUIViewController(_ uiViewController: UIViewController, context: UIViewControllerRepresentableContext<_SpecViewer>) {
    }
}

// View to call:
struct SpectrogramView: View {
    var body: some View {
        VStack {
            Spacer(minLength: 20)
            _SpecViewer()
            Spacer(minLength: 20)
        }
    }
}
