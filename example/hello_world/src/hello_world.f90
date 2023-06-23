module hello_world
  implicit none
  private

  public :: say_hello

  character(*), parameter :: hello = 'Hello'

contains

  function say_hello(world)
    character(:), allocatable :: say_hello
    character(*), intent(in) :: world

    say_hello = hello//', '//world//'!'
  end

end
