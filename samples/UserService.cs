using System;

public class UserService
{
    public string GetUserName(string[] users, int index)
    {
        // Bug: No null check
        // Bug: Possible IndexOutOfRangeException
        return users[index];
    }

    public int CalculateAverage(int total, int count)
    {
        // Bug: Possible division by zero
        return total / count;
    }

    public void PrintUser(string name)
    {
        // Bug: Possible NullReferenceException
        Console.WriteLine("User: " + name.ToUpper());
    }

    public bool IsAdult(int age)
    {
        // Bug: Incorrect boundary condition
        return age > 18;
    }
}