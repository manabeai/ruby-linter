use wasm_bindgen::prelude::*;
use ruby_prism;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct LintResult {
    pub parse_dump: String,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[wasm_bindgen]
pub fn lint_ruby(source: &str) -> String {
    let result = ruby_prism::parse(source.as_bytes());
    
    let parse_dump = format!("{:#?}", result.node());
    
    let errors: ruby_prism::Diagnostics<'_> = result.errors();
    let error_messages: Vec<String> = errors.map(|e| {
        format!("{}", e.message())
    }).collect();
    
    let warnings: ruby_prism::Diagnostics<'_> = result.warnings();
    let warning_messages: Vec<String> = warnings.map(|w| {
        format!("{}", w.message())
    }).collect();
    
    let lint_result = LintResult {
        parse_dump,
        errors: error_messages,
        warnings: warning_messages,
    };
    
    serde_json::to_string(&lint_result).unwrap_or_else(|_| "Error serializing result".to_string())
}