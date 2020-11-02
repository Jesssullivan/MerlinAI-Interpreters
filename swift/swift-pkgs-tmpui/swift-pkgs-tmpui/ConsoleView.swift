//
//  ContentViewa.swift
//  swift-pkgs-tmpui
//
//  Created by Jess on 11/1/20.
//

import SwiftUI
import AVFoundation
import Accelerate
import TensorFlowLite
import Foundation

// MARK: Bundled Files

// accessing of bundled files:
typealias BundleStorage = (name: String, extension: String)

public enum BundledFiles {
    static let model: BundleStorage = (name: "Model", extension: "tflite")
    static let labelsInfo: BundleStorage = (name: "Labels", extension: "txt")
    static let recording: BundleStorage = (name: "FullSongRecording", extension: "wav")
}

// MARK: Load Interpreter w/ model.
class ModelInterpreter {
    
    /// to be populated from initializer:
    private var interpreter: Interpreter
    
    init?() {
        
        // go get the static wav file:
        guard let modelPath = Bundle.main.path(
            forResource: BundledFiles.model.name,
            ofType: BundledFiles.model.extension
        ) else {
            vLog(text: "Failed to load the model @ \n" + BundledFiles.model.name)
            return nil
        }
        
        vLog(text: "Successfully loaded model!")
        
        // MARK: initialize the intepreter w/ the model:
        do {
            
            // Create Interpreter:
            interpreter = try Interpreter(modelPath: modelPath)
            vLog(text: "Successfully created interpreter!")
            
            // Allocate tensors:
            try interpreter.allocateTensors()
            vLog(text: "Successfully created allocated tensors! \n\n:)")
    
            
        } catch let error {
            vLog(text: "Failed to create interpreter! \n @ \(error.localizedDescription)!")
            return nil
        }
    }
}

// MARK: Entry:
struct ConsoleView: View {

    @State var Info = "Loading Intepreter..."
    
    var body: some View {
        VStack {
            SpectrogramView()
            Spacer(minLength: 3)
            Text("Logging to XCode console if available...")
            Spacer(minLength: 33)
            Text(Info)
        }.onAppear {
            ModelInterpreter()
            sleep(1)
            self.Info = "...Finished Loading Intepreter."
        }
    }
}
