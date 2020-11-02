//
//  CreateInterpreterView.swift
//  swift-pkgs-tmpui
//
//  Created by Jess on 11/2/20.
//
import SwiftUI
import TensorFlowLite

// MARK: Entry:
struct CreateInterpreterView: View {
   
    @State var Info = "Loading Intepreter..."
    
    var body: some View {
        
        VStack {
            
            Text(Info)
        
        }.onAppear {
            
            let modelPath = Bundle.main.bundleURL.appendingPathComponent("Model.tflite").path
            
            do {
            
                let interpreter = try Interpreter(modelPath: modelPath)
                
                try interpreter.allocateTensors()
                
                NSLog("Created interpreter")
                
                self.Info = "Created interpreter"

            } catch {
                
                NSLog("\(error)")
                
                self.Info = "\(error)"

            }
        }
    }
}
