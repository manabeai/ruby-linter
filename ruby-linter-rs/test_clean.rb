# Clean Ruby code without errors or warnings

def greet(name)
  puts "Hello, #{name}!"
end

class Calculator
  def add(a, b)
    a + b
  end
  
  def multiply(a, b)
    a * b
  end
end

greet("World")
calc = Calculator.new
result = calc.add(5, 3)
puts "5 + 3 = #{result}"