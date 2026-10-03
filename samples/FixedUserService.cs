using System;

public class UserService
{
    public string GetUserName(string[] users, int index)
    {
        if (users == null)
        {
            throw new ArgumentNullException(nameof(users));
        }

        if (index < 0 || index >= users.Length)
        {
            throw new ArgumentOutOfRangeException(nameof(index));
        }

        return users[index];
    }

    public double CalculateAverage(int total, int count)
    {
        if (count <= 0)
        {
            throw new ArgumentException(
                "Count must be greater than zero.",
                nameof(count)
            );
        }

        return (double)total / count;
    }

    public void PrintUser(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            Console.WriteLine("User name is not available.");
            return;
        }

        Console.WriteLine($"User: {name.ToUpper()}");
    }

    public bool IsAdult(int age)
    {
        return age >= 18;
    }
}