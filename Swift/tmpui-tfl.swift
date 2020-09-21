//
//  tmpui_1_1App.swift
//  tmpui.1.1
//
//  Created by Jess on 9/19/20.

import SwiftUI

@available(iOS 14.0, *)
@main
struct tmpui-tfl: App {
    @availaif #available(iOS 14.0, *) {
    WindowGroup {
    StaticView()
    }
    } else {
    }   var body: some Scene {
        WindowGroup {
            StaticView()
        }
    }
}
