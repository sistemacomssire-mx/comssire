namespace Comssire.DTOs.Sistema
{
    public class AdminResetPasswordDto
    {
        public string NewPassword { get; set; } = string.Empty;

        // recomendado para reset admin
        public bool MustChangePassword { get; set; } = false;
    }
}