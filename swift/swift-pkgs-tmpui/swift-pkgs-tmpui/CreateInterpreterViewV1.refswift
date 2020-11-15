//
//  CreateInterpreterViewV1.swift
//  swift-pkgs-tmpui
//
//  Created by Jess on 11/2/20.
//
import SwiftUI
import AVFoundation
import Accelerate
import TensorFlowLite
import Foundation



// MARK: Entry:
struct CreateInterpreterViewV1: View {
   
    @State var labelInfo = "...waiting for Labels Info..."
    @State var modelInfo = "...waiting for Model Info..."
    @State var interpreterInfo = "...waiting for Interpreter Info..."
    @State var tensorInfo = "...waiting for Tensor Info..."
    @State var Info = ""

    var body: some View {
        
        VStack {
            
            Text(labelInfo)
            Spacer(minLength: 5)
            Text(modelInfo)
            Spacer(minLength: 5)
            Text(interpreterInfo)
            Spacer(minLength: 5)
            Text(tensorInfo)
            Spacer(minLength: 5)
            Text(Info)

        }.onAppear {
            
            do {
                
                // MARK: load labels:
                let labelsURL = Bundle.main.url(forResource: "Labels", withExtension: "txt")
                NSLog("labesURL: " + (labelsURL?.path.description)!)
                self.labelInfo = "labesURL: " + (labelsURL?.path.description)!
                
                let contents = try String(contentsOf: labelsURL!, encoding: .utf8)
                let labels = contents.components(separatedBy: .newlines)
                
                NSLog("labels: " + labels.description)
                self.labelInfo = "labels: " + labels.description
                
                // MARK: load Model & initialize interpreter:
                let modelPath = Bundle.main.bundleURL.appendingPathComponent("Model.tflite").path
                NSLog("modelPath: " + modelPath.description)
                self.modelInfo = "modelPath: " + modelPath.description
                
                let interpreter = try Interpreter(modelPath: modelPath)
                NSLog("Created interpreter")
                self.interpreterInfo = "Created interpreter"
                
                try interpreter.allocateTensors()
                NSLog("allocated Tensors")
                self.interpreterInfo = "allocated Tensors"

                // MARK: load test waveform:
                let waveformArray = wavToArray(file: (BundledFiles.recording.name,
                                                      extension: BundledFiles.recording.extension))
              
                let bytes = waveformArray.map { x in return abs( x / ALPHA ) }
                // print read values?
                // bytes.map { i in return NSLog(i.description) }
        
                let byteData = Data(bytes: bytes, count: sampleRate * 4)

                // MARK: run interpreter:
                try interpreter.copy(byteData, toInputAt: audioBufferInputTensorIndex)

                /// Run inference by invoking the `Interpreter`.
                try interpreter.invoke()
                NSLog("invoked interpreter...")
                self.interpreterInfo = "invoked interpreter..."

                // Get the output `Tensor`
                let outputTensor = try interpreter.output(at: 0)
                NSLog("outputTensor dimensions: " + outputTensor.shape.dimensions.description)
                self.tensorInfo = "outputTensor dimensions: " + outputTensor.shape.dimensions.description

                // Copy output to `Data` to process the inference results.
                let outputSize = outputTensor.shape.dimensions.reduce(1, {x, y in x * y})
                NSLog("outputSize: " + outputSize.description)
                self.tensorInfo = "outputSize: " + outputSize.description
                self.Info = outputTensor.data.map {i in return i}.description
                
                NSLog("finished.")

            } catch {
                
                NSLog("\(error)")
                self.Info = "\(error)"

            }
        }
    }
}

