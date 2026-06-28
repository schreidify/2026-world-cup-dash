pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let _window = tauri::WebviewWindowBuilder::new(
                app,
                "main",
                tauri::WebviewUrl::External(
                    "https://world-cup-dashboard.jen-91b.workers.dev"
                        .parse()
                        .unwrap(),
                ),
            )
            .title("World Cup 2026")
            .inner_size(1280.0, 900.0)
            .min_inner_size(800.0, 600.0)
            .resizable(true)
            .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
