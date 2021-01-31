//
//  CreateInterpreterViewV4.swift
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
struct CreateInterpreterViewV4: View {
   
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
                labels = contents.components(separatedBy: .newlines)
                NSLog("labels: " + labels.description)
                self.labelInfo = "labels: " + labels.description
                
                // MARK: load Model & initialize interpreter:
                let modelPath = Bundle.main.bundleURL.appendingPathComponent("Model.tflite").path
                NSLog("modelPath: " + modelPath.description)
                self.modelInfo = "modelPath: " + modelPath.description
                
                let outputTensor: Tensor
                
                let interpreter = try Interpreter(modelPath: modelPath)
                NSLog("Created interpreter")
                self.interpreterInfo = "Created interpreter"
                
                try interpreter.allocateTensors()
                NSLog("allocated Tensors")
                self.interpreterInfo = "allocated Tensors"
                
                let url = Bundle.main.url(forResource: BundledFiles.recording.name,
                                                                     withExtension: BundledFiles.recording.extension)
                let file = try AVAudioFile(forReading: url!)
                
                NSLog("Received Sample Rate: " + String(file.fileFormat.sampleRate))
                NSLog("Received Channel Count: " + String(file.fileFormat.channelCount))
                
                // Immediately unwrap:
                let format = AVAudioFormat(
                        commonFormat: .pcmFormatFloat32,
                        sampleRate: file.fileFormat.sampleRate,
                        channels: 1,
                        interleaved: false)
                
                let buffer = AVAudioPCMBuffer(pcmFormat: format!, frameCapacity: AVAudioFrameCount(sampleRate))
                try file.read(into: buffer!)
                
                let floatChannel = UnsafeBufferPointer(start: buffer?.floatChannelData, count: 1)
             
                let floatData = Data(bytes: floatChannel[0], count:Int(buffer!.frameCapacity * buffer!.format.streamDescription.pointee.mBytesPerFrame))

                try interpreter.copy(floatData, toInputAt: audioBufferInputTensorIndex)

                var rate = Int32(sampleRate)
                
                let sampleRateData = Data(bytes: &rate, count: MemoryLayout.size(ofValue: rate))
                
                try interpreter.copy(sampleRateData, toInputAt: sampleRateInputTensorIndex)
                
                // MARK: load test waveform:
                
                /// Run inference by invoking the `Interpreter`.
                try interpreter.invoke()
                NSLog("invoked interpreter...")
                self.interpreterInfo = "invoked interpreter..."

                // Get the output `Tensor`
                outputTensor = try interpreter.output(at: 0)
                NSLog("outputTensor dimensions: " + outputTensor.shape.dimensions.description)
                self.tensorInfo = "outputTensor dimensions: " + outputTensor.shape.dimensions.description
               
                // Gets the formatted and averaged results.
                let scores = [Float32](unsafeData: outputTensor.data) ?? []
                NSLog(scores.description)
                
                let results = outputTensor.data.map {i in return i}.description
                NSLog(results.description)
                self.Info = results
                
            } catch {
            
                NSLog("\(error)")
                self.Info = "\(error)"

            }
        }
    }
}
