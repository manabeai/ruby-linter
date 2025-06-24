use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct SimpleLintResult {
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub summary: String,
}

#[wasm_bindgen]
pub fn simple_lint_ruby(source: &str) -> String {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();
    
    // Simple syntax checks
    let lines: Vec<&str> = source.lines().collect();
    let mut open_blocks = 0;
    let mut in_string = false;
    let mut string_char = ' ';
    
    for (line_num, line) in lines.iter().enumerate() {
        let trimmed = line.trim();
        
        // Check for unclosed strings
        let mut chars = line.chars().peekable();
        while let Some(ch) = chars.next() {
            if !in_string && (ch == '"' || ch == '\'') {
                in_string = true;
                string_char = ch;
            } else if in_string && ch == string_char {
                // Check for escaped quotes
                if chars.peek() != Some(&'\\') {
                    in_string = false;
                }
            }
        }
        
        // Check for block openings
        if trimmed.starts_with("def ") || trimmed.starts_with("class ") || 
           trimmed.starts_with("module ") || trimmed.starts_with("if ") || 
           trimmed.starts_with("unless ") || trimmed.starts_with("while ") ||
           trimmed.starts_with("for ") || trimmed.starts_with("case ") ||
           trimmed.starts_with("begin") || trimmed.contains("do |") || trimmed.contains("do\n") {
            open_blocks += 1;
        }
        
        // Check for block closings
        if trimmed == "end" {
            if open_blocks > 0 {
                open_blocks -= 1;
            } else {
                errors.push(format!("Line {}: Unexpected 'end' - no matching block opening", line_num + 1));
            }
        }
        
        // Basic warnings
        if trimmed.contains("puts") && trimmed.contains("\\n") {
            warnings.push(format!("Line {}: Consider using multiple puts statements instead of \\n", line_num + 1));
        }
        
        // Check for missing parentheses in method calls with arguments
        if trimmed.contains(" ") && !trimmed.contains("(") && !trimmed.contains("=") {
            let parts: Vec<&str> = trimmed.split_whitespace().collect();
            if parts.len() > 1 && !["if", "unless", "while", "for", "class", "module", "def", "end", "puts", "print", "p"].contains(&parts[0]) {
                warnings.push(format!("Line {}: Consider using parentheses for method arguments", line_num + 1));
            }
        }
    }
    
    // Check for unclosed blocks
    if open_blocks > 0 {
        errors.push(format!("Missing {} 'end' statement(s)", open_blocks));
    }
    
    // Check for unclosed strings
    if in_string {
        errors.push(format!("Unclosed string literal (started with {})", string_char));
    }
    
    let summary = if errors.is_empty() && warnings.is_empty() {
        "No issues found!".to_string()
    } else {
        format!("Found {} error(s) and {} warning(s)", errors.len(), warnings.len())
    };
    
    let result = SimpleLintResult {
        errors,
        warnings,
        summary,
    };
    
    serde_json::to_string(&result).unwrap_or_else(|_| "Error serializing result".to_string())
}