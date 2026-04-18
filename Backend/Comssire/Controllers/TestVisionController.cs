using Google.Cloud.Vision.V1;
using Microsoft.AspNetCore.Mvc;

namespace Comssire.Controllers
{
    [ApiController]
    [Route("api/test-vision")]
    public class TestVisionController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> Test(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Sin archivo");

            try
            {
                var client = ImageAnnotatorClient.Create();

                await using var stream = file.OpenReadStream();
                var image = Image.FromStream(stream);

                var texts = await client.DetectTextAsync(image);

                var detected = texts.FirstOrDefault()?.Description ?? "No detectó texto";

                return Ok(new
                {
                    success = true,
                    texto = detected
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    error = ex.Message
                });
            }
        }
    }
}