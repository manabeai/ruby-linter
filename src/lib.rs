use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

// rubyのソースコードを文字列で受取、prismでparseしてデバッグ情報出す
#[wasm_bindgen]
pub fn parse_ruby(source: &str) -> String {
    let mut res = ruby_prism::parse(source.as_bytes());

    let errors: ruby_prism::Diagnostics<'_> = res.errors();
    let messages = errors.map(|e| e.message().to_string()).collect::<Vec<_>>();

    if messages.is_empty() {
        return String::from("No errors");
    }
    return messages[0].to_string();
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }

    #[test]
    fn test_collect() {
        let source = "
class Foo
  def initialize(bar)
    @bar = bar
  end
end
";
        let result = parse_ruby(source);
        assert_eq!(result, "No errors");
    }
}
