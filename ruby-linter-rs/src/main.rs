use anyhow::Result;
use ruby_prism;
use std::env;
use std::fs;
use std::io::{self, Read};

fn main() -> Result<()> {
    let args: Vec<String> = env::args().collect();
    
    let source = if args.len() > 1 {
        // Read from file
        fs::read_to_string(&args[1])?
    } else {
        // Read from stdin
        let mut buffer = String::new();
        io::stdin().read_to_string(&mut buffer)?;
        buffer
    };

    // Parse the Ruby source code
    let result = ruby_prism::parse(source.as_bytes());

    // Output parse dump
    println!("=== PARSE DUMP ===");
    println!("{:#?}", result.node());
    
    // Output errors
    let errors: ruby_prism::Diagnostics<'_> = result.errors();
    let error_messages: Vec<String> = errors.map(|e| {
        format!("{}", e.message())
    }).collect();
    
    if !error_messages.is_empty() {
        println!("\n=== ERRORS ===");
        for error in &error_messages {
            println!("{}", error);
        }
    } else {
        println!("\n=== NO ERRORS ===");
    }

    // Output warnings
    let warnings: ruby_prism::Diagnostics<'_> = result.warnings();
    let warning_messages: Vec<String> = warnings.map(|w| {
        format!("{}", w.message())
    }).collect();
    
    if !warning_messages.is_empty() {
        println!("\n=== WARNINGS ===");
        for warning in &warning_messages {
            println!("{}", warning);
        }
    } else {
        println!("\n=== NO WARNINGS ===");
    }

    Ok(())
}